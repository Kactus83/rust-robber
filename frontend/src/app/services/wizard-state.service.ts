import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProcessConfig, WordPair, DiagnosticEntry } from '../types/models';

@Injectable({ providedIn: 'root' })
export class WizardStateService {
  // Config de lancement
  private configSource = new BehaviorSubject<ProcessConfig>({ /* valeurs par défaut */ });
  config$ = this.configSource.asObservable();

  // Diagnostic
  private diagEntriesSource = new BehaviorSubject<DiagnosticEntry[]|null>(null);
  diagnosticEntries$ = this.diagEntriesSource.asObservable();
  private diagProgressSource = new BehaviorSubject<number>(0);
  diagnosticProgress$ = this.diagProgressSource.asObservable();

  // Exécution finale
  private resultSource = new BehaviorSubject<string|null>(null);
  result$ = this.resultSource.asObservable();
  private runProgressSource = new BehaviorSubject<number>(0);
  runProgress$ = this.runProgressSource.asObservable();

  // Update de la config
  updateConfig(partial: Partial<ProcessConfig>) {
    const cur = this.configSource.value;
    this.configSource.next({ ...cur, ...partial });
  }

  setPairs(pairs: WordPair[]) {
    this.updateConfig({ pairs });
  }

  setDiagnostic(entries: DiagnosticEntry[]) {
    this.diagEntriesSource.next(entries);
  }
  setDiagnosticProgress(p: number) {
    this.diagProgressSource.next(p);
  }

  setResult(msg: string) {
    this.resultSource.next(msg);
  }
  setRunProgress(p: number) {
    this.runProgressSource.next(p);
  }
}
