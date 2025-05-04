import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Composant de layout principal.
 *
 * Fournit une structure de base avec un header, une zone principale (router-outlet)
 * et un footer. Utilisé pour encadrer l'ensemble du wizard.
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  imports: [RouterModule]
})
export class LayoutComponent {}
