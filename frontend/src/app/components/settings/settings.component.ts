import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { WizardStateService } from '../../services/wizard-state.service';
import { TauriService }         from '../../services/tauri.service';
import { ProcessConfig, WordPair } from '../../types/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit, OnDestroy {
  config!: ProcessConfig;
  error = '';
  loadingSource = false;
  loadingDest   = false;
  private sub!: Subscription;

  constructor(
    private wizard: WizardStateService,
    private tauri:  TauriService,
    private router: Router
  ) {}

  ngOnInit() {
    this.sub = this.wizard.config$.subscribe(c => {
      this.config = { ...c }; // clone pour interactivité
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  async selectSource() {
    this.loadingSource = true;
    try {
      const path = await this.tauri.selectFolder();
      if (path) this.config.source = path;
    } catch (error) {
      console.error('Erreur lors de la sélection du dossier source', error);
      this.error = 'Erreur lors de la sélection du dossier source.';
    } finally {
      this.loadingSource = false;
    }
  }

  async selectDestination() {
    this.loadingDest = true;
    try {
      const path = await this.tauri.selectFolder();
      if (path) this.config.destination = path;
    } catch {
      this.error = 'Erreur lors de la sélection du dossier de destination.';
    } finally {
      this.loadingDest = false;
    }
  }

  addPair() {
    this.config.pairs.push({ old: '', new: '' });
  }

  removePair(i: number) {
    this.config.pairs.splice(i, 1);
  }

  /** Génère manuellement toutes les variantes lower/upper */
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

  /** Ajoute spécifiquement les paires Fuse→Robber si elles manquent */
  addFuseRobberPairs() {
    const defaults: WordPair[] = [
      { old: 'Fuse', new: 'Robber' },
      { old: 'fuse', new: 'robber' },
      { old: 'FUSE', new: 'ROBBER' },
    ];
    for (const wp of defaults) {
      const exists = this.config.pairs.some(
        x => x.old === wp.old && x.new === wp.new
      );
      if (!exists) this.config.pairs.push(wp);
    }
  }

  canProceed(): boolean {
    return !!this.config.source
        && !!this.config.destination
        && this.config.pairs.length > 0
        && this.config.pairs.every(wp => wp.old.trim() && wp.new.trim());
  }

  next() {
    if (!this.canProceed()) {
      this.error = 'Source, destination et paires (old/new) obligatoires.';
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

  prev() {
    this.router.navigate(['/onboarding']);
  }
}
