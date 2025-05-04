import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { WizardStateService } from '../../services/wizard-state.service';
import { TauriService } from '../../services/tauri.service';
import type { ProcessConfig } from '../../types/models';

/**
 * Composant de l’étape « run » du wizard.
 * Lance la copie & transformations, affiche la progression,
 * gère les erreurs et propose un retry si besoin.
 */
@Component({
  selector: 'app-process',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './process.component.html',
  styleUrls: ['./process.component.scss']
})
export class ProcessComponent implements OnInit, OnDestroy {
  /** Configuration en cours */
  config!: ProcessConfig;
  /** Progression du run (0–100) */
  progress = 0;
  /** Message d’erreur, s’il y en a */
  error = '';
  /** Indique que le processus tourne */
  loading = true;

  private configSub!: Subscription;
  private progressSub!: Subscription;

  constructor(
    private wizard: WizardStateService,
    private tauri: TauriService,
    private router: Router,
    private ngZone: NgZone,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Récupère la config
    this.configSub = this.wizard.config$.subscribe(c => this.config = c);

    // Écoute la progression hors zone Angular
    this.progressSub = this.tauri.runProgress$.subscribe(p => {
      this.ngZone.run(() => {
        this.progress = p;
        this.wizard.setRunProgress(p);
      });
    });

    // Démarre la commande Rust
    this.tauri.runRobber(this.config)
      .then(msg => {
        // Fin de l’exécution : on stocke et on navigue
        this.loading = false;
        this.wizard.setResult(msg);
        this.router.navigate(['/result']);
      })
      .catch(err => {
        // Affiche l’erreur et propose un retry
        this.ngZone.run(() => {
          this.loading = false;
          this.error = typeof err === 'string' ? err : 'Erreur inconnue';
        });
      });
  }

  ngOnDestroy() {
    this.configSub?.unsubscribe();
    this.progressSub?.unsubscribe();
  }

  /** Relance le processus depuis le début */
  retry() {
    this.error = '';
    this.progress = 0;
    this.loading = true;
    this.ngOnInit();
  }
}
