/**
 * Type représentant une paire de mots à remplacer.
 */
export interface WordPair {
  /** Chaîne à rechercher */
  old: string;
  /** Chaîne de remplacement */
  new: string;
}

/**
 * Représente un dossier ou un fichier analysé.
 */
export interface DiagnosticEntry {
  /** Chemin relatif à la source */
  path: string;
  /** true si dossier, false si fichier */
  is_dir: boolean;
  /**
   * Liste des termes trouvés :
   * - `count = undefined` pour un dossier (apparence dans le nom)
   * - `count = n` pour un fichier (nombre d’occurrences)
   */
  matches: { term: string; count?: number }[];
}

/**
 * Configuration du traitement, transmise au backend.
 */
export interface ProcessConfig {
  /** Chemin du dossier source */
  source: string;
  /** Chemin du dossier de destination */
  destination: string;
  /** Si true, crée un sous-dossier pour la destination */
  create_subfolder: boolean;
  /** Nom personnalisé du sous-dossier (optionnel) */
  folder_name?: string;
  /** Si true, utilise un timestamp pour le nom du dossier */
  use_timestamp: boolean;
  /** Si true, génère automatiquement les variantes de casse */
  variants: boolean;
  /** Si true, renomme aussi les fichiers et dossiers après remplacement */
  rename: boolean;
  /** Liste des paires (old → new) à appliquer */
  pairs: WordPair[];
  /** (Optionnel) chemins relatifs détectés lors du diagnostic */
  filter_paths?: string[];
}
