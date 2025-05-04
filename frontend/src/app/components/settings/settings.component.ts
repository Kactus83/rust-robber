import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { WizardStateService } from '../../services/wizard-state.service';
import { TauriService }         from '../../services/tauri.service';
import type { ProcessConfig, WordPair } from '../../types/models';

/**
 * Composant de configuration du projet.
 * 
 * Permet de choisir les dossiers source/destination, 
 * définir les paires de remplacement et options avancées.
 */
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {
  /** Configuration en cours */
  config!: ProcessConfig;
  /** Message d’erreur global */
  error = '';
  /** État de chargement du sélecteur source */
  loadingSource = false;
  /** État de chargement du sélecteur destination */
  loadingDest   = false;
  private sub!: Subscription;

  constructor(
    private wizard: WizardStateService,
    private tauri:  TauriService,
    private router: Router
  ) {}

  ngOnInit() {
    this.sub = this.wizard.config$.subscribe(c => {
      // Clone pour ne pas muter l’original tant qu’on n’a pas validé
      this.config = { ...c };
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  /** Ouvre la boîte de dialogue pour choisir le dossier source */
  async selectSource() {
    this.loadingSource = true;
    this.error = '';
    try {
      const path = await this.tauri.selectFolder();
      if (path) this.config.source = path;
    } catch (err) {
      console.error('Erreur selection source', err);
      this.error = 'Impossible de sélectionner le dossier source.';
    } finally {
      this.loadingSource = false;
    }
  }

  /** Ouvre la boîte de dialogue pour choisir le dossier de destination */
  async selectDestination() {
    this.loadingDest = true;
    this.error = '';
    try {
      const path = await this.tauri.selectFolder();
      if (path) this.config.destination = path;
    } catch (err) {
      console.error('Erreur selection destination', err);
      this.error = 'Impossible de sélectionner le dossier de destination.';
    } finally {
      this.loadingDest = false;
    }
  }

  /** Ajoute une paire vide */
  addPair() {
    this.config.pairs.push({ old: '', new: '' });
  }

  /** Supprime la paire à l’index donné */
  removePair(i: number) {
    this.config.pairs.splice(i, 1);
  }

  /**
   * Génère automatiquement les variantes lower/UPPER
   */
  generatePairsVariants() {
    const seen = new Set<string>();
    const out: WordPair[] = [];
    for (let wp of this.config.pairs) {
      ['orig','lower','upper'].forEach(mode => {
        const o = mode==='lower'
          ? wp.old.toLowerCase()
          : mode==='upper'
            ? wp.old.toUpperCase()
            : wp.old;
        const n = mode==='lower'
          ? wp.new.toLowerCase()
          : mode==='upper'
            ? wp.new.toUpperCase()
            : wp.new;
        const key = `${o}→${n}`;
        if (o && !seen.has(key)) {
          seen.add(key);
          out.push({ old: o, new: n });
        }
      });
    }
    this.config.pairs = out;
  }

  /**
   * Ajoute les paires Fuse→Robber par défaut si absentes
   */
  addFuseRobberPairs() {
    const defaults: WordPair[] = [
      { old: 'Fuse', new: 'Robber' },
      { old: 'fuse', new: 'robber' },
      { old: 'FUSE', new: 'ROBBER' },
    ];
    for (const wp of defaults) {
      if (!this.config.pairs.some(x => x.old===wp.old && x.new===wp.new)) {
        this.config.pairs.push(wp);
      }
    }
  }

  /** Validation avant navigation suivante */
  canProceed(): boolean {
    return !!this.config.source
        && !!this.config.destination
        && this.config.pairs.length > 0
        && this.config.pairs.every(wp => wp.old.trim() && wp.new.trim());
  }

  /** Va à l’étape suivante (diagnostic) */
  next() {
    if (!this.canProceed()) {
      this.error = 'Source, destination et paires obligatoires.';
      return;
    }
    this.wizard.updateConfig({
      source:           this.config.source,
      destination:      this.config.destination,
      create_subfolder: this.config.create_subfolder,
      folder_name:      this.config.folder_name,
      use_timestamp:    this.config.use_timestamp,
      variants:         this.config.variants,
      rename:           this.config.rename
    });
    this.wizard.setPairs(this.config.pairs);
    this.router.navigate(['/diagnose']);
  }

  /** Retour à l’écran précédent (onboarding) */
  prev() {
    this.router.navigate(['/onboarding']);
  }
}
