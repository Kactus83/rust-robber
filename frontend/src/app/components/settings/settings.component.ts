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

  addPair() {
    this.config.pairs.push({ old: '', new: '' });
  }

  removePair(i: number) {
    this.config.pairs.splice(i, 1);
  }

  generateVariants() {
    const seen = new Set<string>();
    const out: WordPair[] = [];
    for (let wp of this.config.pairs) {
      ['orig', 'lower', 'upper'].forEach(mode => {
        let o = mode==='lower' ? wp.old.toLowerCase()
              : mode==='upper' ? wp.old.toUpperCase()
              : wp.old;
        let n = mode==='lower' ? wp.new.toLowerCase()
              : mode==='upper' ? wp.new.toUpperCase()
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

  canProceed(): boolean {
    return !!this.config.source
        && !!this.config.destination
        && this.config.pairs.length > 0
        && this.config.pairs.every(wp => wp.old && wp.new);
  }

  next() {
    if (!this.canProceed()) {
      this.error = 'Veuillez renseigner source, destination et au moins une paire complète.';
      return;
    }
    // Appliquer au state
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
