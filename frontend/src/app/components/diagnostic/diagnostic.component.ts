import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { WizardStateService } from '../../services/wizard-state.service';
import { TauriService } from '../../services/tauri.service';
import type { DiagnosticEntry, ProcessConfig } from '../../types/models';

/** Structure de nœud pour l’arborescence */
interface TreeNode {
  name: string;
  path: string;
  is_dir: boolean;
  matches: { term: string; count?: number }[];
  children: TreeNode[];
  expanded: boolean;
  level: number;
}

@Component({
  selector: 'app-diagnostic',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diagnostic.component.html',
  styleUrls: ['./diagnostic.component.scss']
})
export class DiagnosticComponent implements OnInit, OnDestroy {
  /** Config du wizard */
  config!: ProcessConfig;
  /** Progression (0–100) */
  progress = 0;
  /** Rapport brut du backend */
  report: DiagnosticEntry[] | null = null;
  /** Données transformées en arbre */
  treeData: TreeNode[] = [];
  private sub!: Subscription;

  constructor(
    private wizard: WizardStateService,
    private tauri: TauriService,
    private router: Router
  ) {}

  ngOnInit() {
    // Récupère la config en cours
    this.wizard.config$.subscribe(c => this.config = c);

    // Écoute la progression
    this.sub = this.tauri.diagnoseProgress$.subscribe(p => {
      this.progress = p;
      this.wizard.setDiagnosticProgress(p);
    });

    // Lance le diagnostic et construit l’arbre
    this.tauri.diagnoseRobber(this.config)
      .then((r: DiagnosticEntry[]) => {
        this.report = r;
        this.treeData = this.buildTree(r);
        this.wizard.setDiagnostic(r);

        // =========== FILTRAGE pour ne garder QUE les chemins avec matches ==========
        const relPathsWithMatches = r
          .filter(entry => entry.matches.length > 0)
          .map(entry => entry.path);

        this.wizard.updateConfig({ filter_paths: relPathsWithMatches });

      })
      .catch(err => {
        console.error('Erreur diagnostic:', err);
        alert('Erreur lors de l’analyse du projet (voir console).');
      });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  /**
   * Construit une arborescence triée à partir d’une liste plate.
   */
  private buildTree(entries: DiagnosticEntry[]): TreeNode[] {
    const roots: TreeNode[] = [];
    const map: { [path: string]: TreeNode } = {};

    // Crée chaque nœud et l’insère au bon endroit
    entries.forEach(entry => {
      const norm = entry.path.replace(/\\/g, '/');
      const parts = norm.split('/');
      let currentPath = '';
      let parentList = roots;

      parts.forEach((seg, idx) => {
        currentPath = currentPath ? `${currentPath}/${seg}` : seg;
        let node = map[currentPath];
        const isLeaf = idx === parts.length - 1;
        if (!node) {
          node = {
            name: seg,
            path: currentPath,
            is_dir: isLeaf ? entry.is_dir : true,
            matches: isLeaf ? entry.matches : [],
            children: [],
            expanded: false,
            level: 0
          };
          map[currentPath] = node;
          parentList.push(node);
        }
        parentList = node.children;
      });
    });

    // Trie récursif (dossiers ↑, fichiers ↓, alpha)
    const sortRec = (nodes: TreeNode[]) => {
      nodes.sort((a, b) =>
        a.is_dir === b.is_dir
          ? a.name.localeCompare(b.name)
          : (a.is_dir ? -1 : 1)
      );
      nodes.forEach(n => sortRec(n.children));
    };
    sortRec(roots);

    this.setLevels(roots, 0);
    return roots;
  }

  /** Assigne la propriété `level` pour gérer l’indentation */
  private setLevels(nodes: TreeNode[], lvl: number) {
    nodes.forEach(n => {
      n.level = lvl;
      if (n.children.length) this.setLevels(n.children, lvl + 1);
    });
  }

  /** Ouvre/ferme un dossier */
  toggle(node: TreeNode) {
    node.expanded = !node.expanded;
  }

  /** Passe à l’étape suivante */
  next() {
    this.router.navigate(['/process']);
  }
}
