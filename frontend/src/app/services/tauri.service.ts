import { Injectable, EventEmitter } from '@angular/core';
import type { ProcessConfig, DiagnosticEntry } from '../types/models';

@Injectable({ providedIn: 'root' })
export class TauriService {
  private _invoke!: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;

  /** Progrès du diagnostic (0–100) */
  public diagnoseProgress$ = new EventEmitter<number>();
  /** Progrès du run (0–100) */
  public runProgress$ = new EventEmitter<number>();

  constructor() {
    // charge dynamiquement listen depuis l’API Tauri
    import('@tauri-apps/api/event').then(mod => {
      mod.listen<number>('diagnose-progress', e => this.diagnoseProgress$.emit(e.payload));
      mod.listen<number>('robber-progress',  e => this.runProgress$.emit(e.payload));
    });

    // charge dynamiquement invoke depuis core
    import('@tauri-apps/api/core').then(mod => {
      if (!mod.invoke) {
        console.error('invoke introuvable dans @tauri-apps/api/core');
      }
      this._invoke = mod.invoke;
    }).catch(err => {
      console.error('Échec import @tauri-apps/api/core', err);
    });
  }

  /** Lance le diagnostic “à blanc”. */
  async diagnoseRobber(config: ProcessConfig): Promise<DiagnosticEntry[]> {
    if (!this._invoke) {
      throw new Error('Tauri invoke non chargé');
    }
    return (this._invoke('diagnose_robber', { config }) as Promise<DiagnosticEntry[]>);
  }

  /** Lance le traitement principal. */
  async runRobber(config: ProcessConfig): Promise<string> {
    if (!this._invoke) {
      throw new Error('Tauri invoke non chargé');
    }
    return (this._invoke('run_robber', { config }) as Promise<string>);
  }
}