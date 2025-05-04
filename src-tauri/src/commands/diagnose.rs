//! Commande Tauri : analyse “à blanc” le dossier source,
//! renvoie une liste décrivant chaque entrée et ses occurrences.

use std::{fs, path::PathBuf};
use tauri::{command, Window, Emitter};
use walkdir::WalkDir;

use crate::{
    config::process_config::ProcessConfig,
    services::file_manager::FileManager,
    services::text_service::TextService,
    types::diagnostic::{DiagnosticEntry, MatchInfo},
};

/// Parcourt la source, pour chaque fichier ou dossier :
///  - dossier : indique quels termes apparaissent dans son nom
///  - fichier : nombre d’occurrences de chaque terme
/// Émet des events "diagnose-progress" (0–100) pendant le parcours.
#[command]
pub fn diagnose_robber(
    window: Window,
    config: ProcessConfig,
) -> Result<Vec<DiagnosticEntry>, String> {
    let src = PathBuf::from(&config.source);

    // Service de filtrage
    let fm = FileManager::new(vec![
        ".png".into(),
        ".jpg".into(),
        ".jpeg".into(),
        ".gif".into(),
        ".bmp".into(),
        ".woff2".into(),
    ]);

    // Prépare les paires, avec variantes si demandé
    let mut pairs = config.pairs.clone();
    if config.variants {
        pairs = TextService::expand_variants(&pairs);
    }

    // Collecte toutes les entrées à parcourir
    let entries: Vec<_> = WalkDir::new(&src).into_iter().filter_map(Result::ok).collect();
    let total = entries.len() as u32;
    let mut processed = 0u32;

    let mut report = Vec::with_capacity(entries.len());
    for entry in entries {
        let path = entry.path();
        let rel = path.strip_prefix(&src).unwrap_or(path);
        let display = rel.to_string_lossy().to_string();

        // Construire la liste des correspondances
        let mut matches = Vec::new();
        if entry.file_type().is_dir() {
            let name = path.file_name().unwrap().to_string_lossy();
            for wp in &pairs {
                if name.contains(&wp.old) {
                    matches.push(MatchInfo { term: wp.old.clone(), count: None });
                }
            }
        } else if entry.file_type().is_file() && !fm.is_ignored(path) {
            let content = fs::read_to_string(path).unwrap_or_default();
            for wp in &pairs {
                let count = content.matches(&wp.old).count();
                if count > 0 {
                    matches.push(MatchInfo {
                        term: wp.old.clone(),
                        count: Some(count),
                    });
                }
            }
        }

        report.push(DiagnosticEntry {
            path: display,
            is_dir: entry.file_type().is_dir(),
            matches,
        });

        // Émettre progression
        processed += 1;
        let pct = (processed * 100) / total;
        window
            .emit("diagnose-progress", pct)
            .map_err(|e| e.to_string())?;
    }

    Ok(report)
}
