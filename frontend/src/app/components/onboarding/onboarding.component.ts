import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

/**
 * Composant de l’écran d’accueil (onboarding).
 * Raconte l’origine Python du projet et sa transformation Angular,
 * dans un ton fun et ironique.
 */
@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss']
})
export class OnboardingComponent {
  /** Indique que la navigation est en cours */
  loading = false;

  constructor(private router: Router) {}

  /**
   * Lance la navigation vers la page des paramètres,
   * avec un petit délai pour laisser l’animation finir.
   */
  next() {
    this.loading = true;
    setTimeout(() => {
      this.router.navigate(['/settings']);
    }, 300);
  }
}
