import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { WizardStateService } from '../../services/wizard-state.service';
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
  loadingDest = false;
  private sub!: Subscription;

  constructor(
    private wizard: WizardStateService,
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

  /** Ouvre le dialog Tauri pour choisir un dossier source */
  async selectSource() {
    this.loadingSource = true;
    try {
      const { open } = await import('@tauri-apps/api/dialog');
      const selected = (await open({ directory: true })) as string | null;
      if (selected) {
        this.config.source = selected;
      }
    } catch {
      this.error = 'Impossible de sélectionner le dossier source.';
    } finally {
      this.loadingSource = false;
    }
  }

  /** Ouvre le dialog Tauri pour choisir un dossier destination */
  async selectDestination() {
    this.loadingDest = true;
    try {
      const { open } = await import('@tauri-apps/api/dialog');
      const selected = (await open({ directory: true })) as string | null;
      if (selected) {
        this.config.destination = selected;
      }
    } catch {
      this.error = 'Impossible de sélectionner le dossier de destination.';
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

  /** Génère les variantes lower/upper pour toutes les paires actuelles */
  generatePairsVariants() {
    const seen = new Set<string>();
    const out: WordPair[] = [];
    for (let wp of this.config.pairs) {
      ['orig', 'lower', 'upper'].forEach(mode => {
        const o = mode === 'lower'
          ? wp.old.toLowerCase()
          : mode === 'upper'
            ? wp.old.toUpperCase()
            : wp.old;
        const n = mode === 'lower'
          ? wp.new.toLowerCase()
          : mode === 'upper'
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

  /** Validation minimale avant de passer à l’étape suivante */
  canProceed(): boolean {
    return !!this.config.source
        && !!this.config.destination
        && this.config.pairs.length > 0
        && this.config.pairs.every(wp => wp.old.trim() && wp.new.trim());
  }

  next() {
    if (!this.canProceed()) {
      this.error = 'Source, destination et paires (Old/New) obligatoires.';
      return;
    }
    // Sauvegarde dans le state
    this.wizard.updateConfig({
      source: this.config.source,
      destination: this.config.destination,
      create_subfolder: this.config.create_subfolder,
      folder_name: this.config.folder_name,
      use_timestamp: this.config.use_timestamp,
      variants: this.config.variants,
      rename: this.config.rename
    });
    this.wizard.setPairs(this.config.pairs);
    this.router.navigate(['/diagnose']);
  }

  prev() {
    this.router.navigate(['/onboarding']);
  }
}
