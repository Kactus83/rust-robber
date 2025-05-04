//! Types pour le diagnostic avant exécution de Project Robber.

use serde::{Deserialize, Serialize};

/// Représente un dossier ou un fichier analysé.
#[derive(Serialize, Deserialize, Clone)]
pub struct DiagnosticEntry {
    /// Chemin relatif à la source
    pub path: String,
    /// true si dossier, false si fichier
    pub is_dir: bool,
    /// Liste des termes trouvés :
    /// - `count = None` pour un dossier (apparence dans le nom)
    /// - `Some(n)` pour un fichier (nombre d’occurrences)
    pub matches: Vec<MatchInfo>,
}

/// Détail d’une correspondance d’un terme.
#[derive(Serialize, Deserialize, Clone)]
pub struct MatchInfo {
    /// Terme tel quel (avant variantes)
    pub term: String,
    /// Nombre d’occurrences (None pour dossier)
    pub count: Option<usize>,
}
