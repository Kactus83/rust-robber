//! Type représentant une paire de mots à remplacer.

use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
pub struct WordPair {
    /// Chaîne à rechercher
    pub old: String,
    /// Chaîne de remplacement
    pub new: String,
}
