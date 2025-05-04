//! Service responsable de la copie, du filtrage et du comptage de fichiers.

use anyhow::Context;
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

pub struct FileManager {
    ignored_exts: Vec<String>,
}

impl FileManager {
    /// Crée un nouveau FileManager avec les extensions à ignorer.
    pub fn new(ignored_exts: Vec<String>) -> Self {
        Self { ignored_exts }
    }

    /// Détermine si un chemin doit être ignoré selon son extension.
    pub fn is_ignored(&self, path: &Path) -> bool {
        path.extension()
            .and_then(|e| e.to_str())
            .map_or(false, |ext| self.ignored_exts.contains(&format!(".{}", ext).to_lowercase()))
    }

    /// Copie récursivement tout `src` vers `dest`, en recréant l'arborescence.
    pub fn copy_all(&self, src: &Path, dest: &Path) -> anyhow::Result<()> {
        for entry in WalkDir::new(src).into_iter().filter_map(Result::ok) {
            let rel = entry.path().strip_prefix(src)?;
            let target = dest.join(rel);
            if entry.file_type().is_dir() {
                fs::create_dir_all(&target)
                    .with_context(|| format!("Échec création de {:?}", target))?;
            } else {
                if let Some(parent) = target.parent() {
                    fs::create_dir_all(parent)
                        .with_context(|| format!("Échec création de {:?}", parent))?;
                }
                fs::copy(entry.path(), &target)
                    .with_context(|| format!("Échec copie {:?} → {:?}", entry.path(), target))?;
            }
        }
        Ok(())
    }

    /// Compte les fichiers non ignorés sous `src`.
    pub fn count_eligible(&self, src: &Path) -> usize {
        WalkDir::new(src)
            .into_iter()
            .filter_map(Result::ok)
            .filter(|e| e.file_type().is_file() && !self.is_ignored(e.path()))
            .count()
    }
}
