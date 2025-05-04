//! Service de renommage de fichiers et dossiers,
//! parcours bottom-up pour éviter les collisions.

use anyhow::Context;
use std::fs;
use std::path::Path;
use walkdir::WalkDir;
use crate::types::word_pair::WordPair;

pub struct Renamer;

impl Renamer {
    /// Renomme tous les fichiers et dossiers sous `root` selon `pairs`.
    pub fn rename_all(root: &Path, pairs: &[WordPair]) -> anyhow::Result<()> {
        // On collecte d'abord toutes les entrées, on inverse pour bottom-up
        let mut entries: Vec<_> = WalkDir::new(root)
            .min_depth(1)
            .into_iter()
            .filter_map(Result::ok)
            .collect();
        entries.reverse();

        for entry in entries {
            let path = entry.path();
            let name = entry.file_name().to_string_lossy().to_string();
            let mut new_name = name.clone();
            for wp in pairs {
                new_name = new_name.replace(&wp.old, &wp.new);
            }
            if new_name != name {
                let new_path = path.with_file_name(&new_name);
                fs::rename(path, &new_path)
                    .with_context(|| format!("Renommage {:?} → {:?}", path, new_path))?;
            }
        }
        Ok(())
    }
}
