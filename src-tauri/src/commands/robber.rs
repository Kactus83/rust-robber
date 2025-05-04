//! Commande Tauri exposée : exécute le traitement complet "Project Robber".

use anyhow::Context;
use chrono::Local;
use std::{fs, path::PathBuf};
use tauri::{command, Window};
use walkdir::WalkDir;

use crate::{
    config::process_config::ProcessConfig,
    services::{file_manager::FileManager, renamer::Renamer, text_service::TextService},
};

/// Lance la copie, le remplacement de texte et (optionnellement) le renommage.
/// Émet des events "robber-progress" (0–100) pendant le remplacement.
#[command]
pub fn run_robber(window: Window, config: ProcessConfig) -> Result<String, String> {
    let src = PathBuf::from(&config.source);
    let dest_root = PathBuf::from(&config.destination);

    // Détermine le chemin final
    let dest = if config.create_subfolder {
        let name = if config.use_timestamp {
            Local::now().format("%Y%m%d_%H%M%S").to_string()
        } else {
            config
                .folder_name
                .clone()
                .unwrap_or_else(|| src.file_name().unwrap().to_string_lossy().into_owned())
        };
        let p = dest_root.join(name);
        fs::create_dir_all(&p).map_err(|e| e.to_string())?;
        p
    } else {
        dest_root
    };

    // Services
    let fm = FileManager::new(vec![
        ".png".into(),
        ".jpg".into(),
        ".jpeg".into(),
        ".gif".into(),
        ".bmp".into(),
        ".woff2".into(),
    ]);

    // Copie initiale
    fm.copy_all(&src, &dest).map_err(|e| e.to_string())?;

    // Prépare les paires (avec variantes si demandé)
    let mut pairs = config.pairs.clone();
    if config.variants {
        pairs = TextService::expand_variants(&pairs);
    }

    // Remplacement de texte avec progression
    let total = fm.count_eligible(&src) as u32;
    let mut processed = 0u32;

    for entry in WalkDir::new(&dest).into_iter().filter_map(Result::ok) {
        let path = entry.path();
        if entry.file_type().is_file() && !fm.is_ignored(path) {
            TextService::replace_in_file(path, &pairs).map_err(|e| e.to_string())?;
            processed += 1;
            let pct = (processed * 100) / total;
            window
                .emit("robber-progress", pct)
                .map_err(|e| e.to_string())?;
        }
    }

    // Renommage final (optionnel)
    if config.rename {
        Renamer::rename_all(&dest, &pairs).map_err(|e| e.to_string())?;
    }

    Ok(format!("{} fichiers traités", processed))
}
