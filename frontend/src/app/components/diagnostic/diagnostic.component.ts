import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { WizardStateService } from '../../services/wizard-state.service';
import { TauriService } from '../../services/tauri.service';
import { DiagnosticEntry, ProcessConfig } from '../../types/models';

@Component({
  selector: 'app-diagnostic',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diagnostic.component.html',
  styleUrls: ['./diagnostic.component.scss']
})
export class DiagnosticComponent implements OnInit, OnDestroy {
  config!: ProcessConfig;
  progress = 0;
  report: DiagnosticEntry[]|null = null;
  sub!: Subscription;

  constructor(
    private wizard: WizardStateService,
    private tauri: TauriService,
    private router: Router
  ) {}

  ngOnInit() {
    this.wizard.config$.subscribe(c => this.config = c);

    // écouter la progression
    this.sub = this.tauri.diagnoseProgress$.subscribe(p => {
      this.progress = p;
      this.wizard.setDiagnosticProgress(p);
    });

    // lancer le diagnostic
    this.tauri.diagnoseRobber(this.config)
      .then((r: DiagnosticEntry[]) => {
        this.report = r;
        this.wizard.setDiagnostic(r);
      })
      .catch(err => alert('Erreur diagnostic : ' + err));
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  next() {
    this.router.navigate(['/process']);
  }
}