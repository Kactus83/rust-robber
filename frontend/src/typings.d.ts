/**
 * Déclaration de module pour le package Tauri afin de reconnaître la fonction `invoke`
 * depuis le chemin "@tauri-apps/api/tauri".
 */
declare module '@tauri-apps/api' {
    /**
     * Appelle une commande Tauri.
     *
     * @param cmd La commande à invoquer.
     * @param args (Optionnel) Un objet contenant les arguments à passer à la commande.
     * @returns Une promesse qui se résout avec la valeur renvoyée par la commande.
     */
    export function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T>;
  }
  
/**
 * Déclarations pour le module @tauri-apps/api/dialog
 * qui expose notamment la fonction `open`.
 */
declare module '@tauri-apps/api/dialog' {
  /**
   * Ouvre une boîte de dialogue native.
   * @param options.directory Si true, n’autorise que la sélection d’un dossier.
   * @returns Le chemin sélectionné, ou null si annulé.
   */
  export function open(options: { directory: boolean }): Promise<string | string[] | null>;
}