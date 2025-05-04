import { Injectable, EventEmitter } from '@angular/core';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { ProcessConfig } from '../types/models';

@Injectable({ providedIn: 'root' })
export class TauriService {
  // événements de progression
  diagnoseProgress$ = new EventEmitter<number>();
  runProgress$ = new EventEmitter<number>();

  constructor() {
    listen<number>('diagnose-progress', e => {
      this.diagnoseProgress$.emit(e.payload);
    });
    listen<number>('robber-progress', e => {
      this.runProgress$.emit(e.payload);
    });
  }

  // Diagnostique "à blanc" (report)
  async diagnoseRobber(config: ProcessConfig): Promise<any> {
    return invoke<any[]>('diagnose_robber', { config });
  }

  // Exécution finale
  async runRobber(config: ProcessConfig): Promise<string> {
    return invoke<string>('run_robber', { config });
  }
}