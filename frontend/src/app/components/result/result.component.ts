import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { WizardStateService } from '../../services/wizard-state.service';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.scss']
})
export class ResultComponent implements OnInit, OnDestroy {
  result = '';
  private sub!: Subscription;

  constructor(
    private wizard: WizardStateService,
    private router: Router
  ) {}

  ngOnInit() {
    this.sub = this.wizard.result$.subscribe(r => this.result = r || '');
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  finish() {
    this.router.navigate(['/onboarding']);
  }
}
