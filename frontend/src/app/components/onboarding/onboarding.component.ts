import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss']
})
export class OnboardingComponent {
  loading = false;

  constructor(private router: Router) {}

  next() {
    this.loading = true;
    // Simuler un petit délai si besoin, sinon direct
    setTimeout(() => {
      this.router.navigate(['/settings']);
    }, 200);
  }
}
