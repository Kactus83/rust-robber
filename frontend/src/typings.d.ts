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
  
