import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { WizardStateService } from '../../services/wizard-state.service';
import { TauriService } from '../../services/tauri.service';
import { ProcessConfig } from '../../types/models';

@Component({
  selector: 'app-process',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './process.component.html',
  styleUrls: ['./process.component.scss']
})
export class ProcessComponent implements OnInit, OnDestroy {
  config!: ProcessConfig;
  progress = 0;
  error = '';
  loading = true;
  private sub!: Subscription;

  constructor(
    private wizard: WizardStateService,
    private tauri: TauriService,
    private router: Router
  ) {}

  ngOnInit() {
    this.wizard.config$.subscribe(c => this.config = c);

    this.sub = this.tauri.runProgress$.subscribe(p => {
      this.progress = p;
      this.wizard.setRunProgress(p);
    });

    this.tauri.runRobber(this.config)
      .then(msg => {
        this.loading = false;
        this.wizard.setResult(msg);
        this.router.navigate(['/result']);
      })
      .catch(err => {
        this.loading = false;
        this.error = err as string || 'Erreur inconnue';
      });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  retry() {
    this.error = '';
    this.loading = true;
    this.progress = 0;
    this.ngOnInit();
  }
}
