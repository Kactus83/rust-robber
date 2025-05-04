/**
 * Service permettant la communication avec le backend Tauri.
 * 
 * - Charge dynamiquement la fonction `invoke` depuis `@tauri-apps/api/core`.
 * - Charge dynamiquement `open`, `save` depuis `@tauri-apps/plugin-dialog`.
 * - Souscrit aux événements de progression (`diagnose-progress`, `robber-progress`).
 * - Expose les méthodes `diagnoseRobber`, `runRobber` et `selectFolder`.
 */

import { Injectable, EventEmitter } from '@angular/core';
import type { ProcessConfig, DiagnosticEntry } from '../types/models';

@Injectable({
  providedIn: 'root'
})
export class TauriService {
  /** Invoke Tauri (chargé dynamiquement) */
  private _invoke: ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null = null;

  /** Open dialog (chargé dynamiquement) */
  private _openDialog: ((options: { directory: boolean }) => Promise<string | string[] | null>) | null = null;

  /** Progrès du diagnostic (0–100) */
  public diagnoseProgress$ = new EventEmitter<number>();
  /** Progrès du run (0–100) */
  public runProgress$      = new EventEmitter<number>();

  constructor() {
    // Charge et souscrit aux événements de progression
    import('@tauri-apps/api/event')
      .then(mod => {
        mod.listen<number>('diagnose-progress', e => this.diagnoseProgress$.emit(e.payload));
        mod.listen<number>('robber-progress',  e => this.runProgress$.emit(e.payload));
      })
      .catch(err => console.error('Échec import @tauri-apps/api/event', err));

    // Pré-charge invoke et dialog dès le départ
    this.loadInvoke().catch(err => console.error('Échec loadInvoke', err));
    this.loadDialog().catch(err => console.error('Échec loadDialog', err));
  }

  /**
   * Charge dynamiquement la fonction `invoke` depuis `@tauri-apps/api/core`.
   * @returns La fonction `invoke` pour appeler des commandes Tauri.
   * @throws Erreur si la fonction n’est pas trouvée.
   */
  private async loadInvoke(): Promise<(cmd: string, args?: Record<string, unknown>) => Promise<unknown>> {
    if (!this._invoke) {
      const mod = await import('@tauri-apps/api/core');
      if (typeof mod.invoke !== 'function') {
        throw new Error('La fonction invoke n’a pas été trouvée dans @tauri-apps/api/core');
      }
      this._invoke = mod.invoke;
    }
    return this._invoke;
  }

  /**
   * Charge dynamiquement la fonction `open` depuis `@tauri-apps/plugin-dialog`.
   * @returns La fonction `open` pour sélectionner un dossier.
   * @throws Erreur si la fonction n’est pas trouvée.
   */
  private async loadDialog(): Promise<(options: { directory: boolean }) => Promise<string | string[] | null>> {
    if (!this._openDialog) {
      const mod = await import('@tauri-apps/plugin-dialog');
      if (typeof mod.open !== 'function') {
        throw new Error('La fonction open n’a pas été trouvée dans @tauri-apps/plugin-dialog');
      }
      this._openDialog = mod.open;
    }
    return this._openDialog;
  }

  /**
   * Ouvre une boîte de dialogue native pour sélectionner un dossier,
   * et renvoie toujours une `string` ou `null`.
   * @returns Le chemin sélectionné (string) ou null si l’utilisateur annule.
   * @throws Erreur si le module n’est pas chargé.
   */
  async selectFolder(): Promise<string | null> {
    const open = await this.loadDialog();
    const result = await open({ directory: true });
    // On ne garde que le premier chemin si on reçoit un tableau
    if (Array.isArray(result)) {
      return result.length > 0 ? result[0] : null;
    }
    return result;
  }

  /**
   * Lance la commande de diagnostic “à blanc” du backend Rust.
   * @param config La configuration du processus.
   * @returns Un tableau de `DiagnosticEntry`.
   * @throws Erreur si `invoke` n’est pas chargé ou si la commande échoue.
   */
  async diagnoseRobber(config: ProcessConfig): Promise<DiagnosticEntry[]> {
    const invoke = await this.loadInvoke();
    return invoke('diagnose_robber', { config }) as Promise<DiagnosticEntry[]>;
  }

  /**
   * Lance la commande principale `run_robber` pour copier, remplacer et renommer.
   * @param config La configuration du processus.
   * @returns Un message résumé du nombre de fichiers traités.
   * @throws Erreur si `invoke` n’est pas chargé ou si la commande échoue.
   */
  async runRobber(config: ProcessConfig): Promise<string> {
    const invoke = await this.loadInvoke();
    return invoke('run_robber', { config }) as Promise<string>;
  }
}