//! Définition de la configuration du traitement,
//! désérialisée depuis le frontend Angular/Tauri.

use serde::Deserialize;
use crate::types::word_pair::WordPair;

#[derive(Deserialize)]
pub struct ProcessConfig {
    pub source: String,
    pub destination: String,
    pub create_subfolder: bool,
    pub folder_name: Option<String>,
    pub use_timestamp: bool,
    pub variants: bool,
    pub rename: bool,
    pub pairs: Vec<WordPair>,
    /// (Optionnel) liste de chemins relatifs issus du diagnostic.
    pub filter_paths: Option<Vec<String>>,
}
