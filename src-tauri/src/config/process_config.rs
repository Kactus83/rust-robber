//! Définition de la configuration du traitement,
//! désérialisée depuis le frontend Angular/Tauri.

use serde::Deserialize;
use crate::types::word_pair::WordPair;

#[derive(Deserialize)]
pub struct ProcessConfig {
    /// Chemin du dossier source
    pub source: String,
    /// Chemin du dossier de destination
    pub destination: String,
    /// Si true, crée un sous-dossier pour la destination
    pub create_subfolder: bool,
    /// Nom personnalisé du sous-dossier (optionnel)
    pub folder_name: Option<String>,
    /// Si true, utilise un timestamp pour le nom du dossier
    pub use_timestamp: bool,
    /// Si true, génère automatiquement les variantes de casse
    pub variants: bool,
    /// Si true, renomme aussi les fichiers et dossiers après remplacement
    pub rename: bool,
    /// Liste des paires (old → new) à appliquer
    pub pairs: Vec<WordPair>,
}
