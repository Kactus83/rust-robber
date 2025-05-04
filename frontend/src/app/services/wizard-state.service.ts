import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProcessConfig, WordPair, DiagnosticEntry } from '../types/models';

@Injectable({ providedIn: 'root' })
export class WizardStateService {
  // 1. Config pour le run
  private configSource = new BehaviorSubject<ProcessConfig>({
    source: '',
    destination: '',
    create_subfolder: true,
    folder_name: '',
    use_timestamp: true,
    variants: false,
    rename: false,
    pairs: []
  });
  config$ = this.configSource.asObservable();

  // 2. Diagnostic
  private diagEntriesSource   = new BehaviorSubject<DiagnosticEntry[] | null>(null);
  diagnosticEntries$          = this.diagEntriesSource.asObservable();
  private diagProgressSource  = new BehaviorSubject<number>(0);
  diagnosticProgress$         = this.diagProgressSource.asObservable();

  // 3. Résultat final
  private resultSource        = new BehaviorSubject<string | null>(null);
  result$                     = this.resultSource.asObservable();
  private runProgressSource   = new BehaviorSubject<number>(0);
  runProgress$                = this.runProgressSource.asObservable();

  /** Met à jour partiellement la config */
  updateConfig(partial: Partial<ProcessConfig>) {
    const cur = this.configSource.value;
    this.configSource.next({ ...cur, ...partial });
  }

  /** Définit les paires de mots */
  setPairs(pairs: WordPair[]) {
    this.updateConfig({ pairs });
  }

  /** Définit le report diagnostic */
  setDiagnostic(entries: DiagnosticEntry[]) {
    this.diagEntriesSource.next(entries);
  }

  /** Met à jour la progression du diagnostic */
  setDiagnosticProgress(p: number) {
    this.diagProgressSource.next(p);
  }

  /** Définit le message résultat */
  setResult(msg: string) {
    this.resultSource.next(msg);
  }

  /** Met à jour la progression du run */
  setRunProgress(p: number) {
    this.runProgressSource.next(p);
  }
}
