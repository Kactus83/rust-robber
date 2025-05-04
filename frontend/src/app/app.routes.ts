import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { OnboardingComponent } from './components/onboarding/onboarding.component';
import { SettingsComponent } from './components/settings/settings.component';
import { DiagnosticComponent } from './components/diagnostic/diagnostic.component';
import { ProcessComponent } from './components/process/process.component';
import { ResultComponent } from './components/result/result.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'onboarding', pathMatch: 'full' },
      { path: 'onboarding', component: OnboardingComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'diagnose', component: DiagnosticComponent },
      { path: 'process', component: ProcessComponent },
      { path: 'result', component: ResultComponent },
    ],
  },
  { path: '**', redirectTo: 'onboarding' },
];
