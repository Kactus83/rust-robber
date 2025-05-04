import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
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
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    // Récupère la config en cours
    this.wizard.config$.subscribe(c => this.config = c);

    // Écoute la progression et force la détection de changements
    this.sub = this.tauri.diagnoseProgress$.subscribe(p => {
      this.ngZone.run(() => {
        this.progress = p;
        this.wizard.setDiagnosticProgress(p);
      });
    });

    // Démarre le diagnostic et construit l’arborescence
    this.tauri.diagnoseRobber(this.config)
      .then((r: DiagnosticEntry[]) => {
        this.ngZone.run(() => {
          this.report = r;
          this.treeData = this.buildTree(r);
          this.wizard.setDiagnostic(r);
          const filtered = r.filter(e => e.matches.length > 0).map(e => e.path);
          this.wizard.updateConfig({ filter_paths: filtered });
        });
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
   * Construit une arborescence triée (dossiers avant fichiers).
   */
  private buildTree(entries: DiagnosticEntry[]): TreeNode[] {
    const roots: TreeNode[] = [];
    const map: Record<string, TreeNode> = {};

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
            is_dir: !isLeaf || entry.is_dir,
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

  /** Attribue un niveau pour l’indentation */
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

  /** Retourne à la configuration */
  back() {
    this.router.navigate(['/settings']);
  }

  /** Passe à l’étape suivante */
  next() {
    this.router.navigate(['/process']);
  }
}
