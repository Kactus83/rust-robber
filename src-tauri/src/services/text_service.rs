//! Service de remplacement de texte dans les fichiers,
//! avec génération d’variants de casse.

use anyhow::Context;
use regex::Regex;
use std::fs;
use std::path::Path;
use crate::types::word_pair::WordPair;

pub struct TextService;

impl TextService {
    /// Génère pour chaque paire (Old, New) les variantes
    /// (old→new, OLD→NEW, oldcase→newcase) sans doublons.
    pub fn expand_variants(pairs: &[WordPair]) -> Vec<WordPair> {
        let mut all = Vec::new();
        for wp in pairs {
            let candidates = vec![
                (wp.old.clone(), wp.new.clone()),
                (wp.old.to_lowercase(), wp.new.to_lowercase()),
                (wp.old.to_uppercase(), wp.new.to_uppercase()),
            ];
            for (o, n) in candidates {
                if !all.iter().any(|x: &WordPair| x.old == o && x.new == n) {
                    all.push(WordPair { old: o, new: n });
                }
            }
        }
        all
    }

    /// Remplace toutes les occurrences de chaque paire dans le fichier `path`.
    pub fn replace_in_file(path: &Path, pairs: &[WordPair]) -> anyhow::Result<()> {
        let content = fs::read_to_string(path)
            .with_context(|| format!("Lecture de {:?}", path))?;
        let mut new = content.clone();
        for wp in pairs {
            // Échappe la chaîne pour éviter les métacaractères regex
            let pattern = Regex::new(&regex::escape(&wp.old))
                .with_context(|| format!("Construction regex pour `{}`", &wp.old))?;
            new = pattern.replace_all(&new, &wp.new[..]).into_owned();
        }
        fs::write(path, new)
            .with_context(|| format!("Écriture de {:?}", path))?;
        Ok(())
    }
}
