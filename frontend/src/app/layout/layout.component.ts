import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Composant de layout principal.
 * Fournit un header animé, une zone principale (router-outlet) et un footer ludique.
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  imports: [RouterModule]
})
export class LayoutComponent {}
