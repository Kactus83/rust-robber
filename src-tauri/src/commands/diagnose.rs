// src-tauri/src/commands/diagnose.rs

//! Commande Tauri : analyse “à blanc” le dossier source,
//! renvoie un vecteur de `DiagnosticEntry`, et émet “diagnose-progress”
//! tous les 5 % (et un événement final à 100 %).

use std::{
    fs,
    path::PathBuf,
    sync::{
        Arc,
        atomic::{AtomicU32, Ordering},
        Mutex,
    },
};
use tauri::{command, Window, Emitter};
use walkdir::WalkDir;
use rayon::prelude::*;

use crate::{
    config::process_config::ProcessConfig,
    services::{file_manager::FileManager, text_service::TextService},
    types::{
        diagnostic::{DiagnosticEntry, MatchInfo},
        word_pair::WordPair,
    },
};

/// Lance l’analyse en arrière-plan, émettant `diagnose-progress` (0–100 tous les 5 %),
/// et renvoie le rapport complet.
#[command]
pub async fn diagnose_robber(
    window: Window,
    config: ProcessConfig,
) -> Result<Vec<DiagnosticEntry>, String> {
    // Clone pour la boucle de fond
    let window_bg = window.clone();
    let src = PathBuf::from(&config.source);

    // Prépare les paires (avec variantes si demandé)
    let pairs: Vec<WordPair> = if config.variants {
        TextService::expand_variants(&config.pairs)
    } else {
        config.pairs.clone()
    };

    // Exécution bloquante dans un thread dédié
    let report = tauri::async_runtime::spawn_blocking(move || {
        diagnose_task(&window_bg, &src, &pairs)
    })
    .await
    .map_err(|e| e.to_string())??;

    // Événement final garanti à 100 %
    let _ = window.emit("diagnose-progress", 100usize);

    Ok(report)
}

/// Tâche sync : parcourt le dossier, recherche les paires,
/// et émet l’avancement tous les 5 %.
fn diagnose_task(
    window: &Window,
    src: &PathBuf,
    pairs: &[WordPair],
) -> Result<Vec<DiagnosticEntry>, String> {
    // Initialise FileManager pour ignorer les fichiers binaires
    let fm = FileManager::new(
        vec![
            ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".woff2", ".exe", ".dll",
            ".dmg", ".zip", ".tar", ".gz", ".bz2", ".xz", ".7z", ".rar",
            ".tar.gz", ".tar.bz2", ".tar.xz", ".tar.7z", ".tar.rar",
            ".tar.lz", ".tar.lzma", ".tar.lzo", ".tar.lzop",
            ".tar.lz4", ".tar.lzip", ".tar.lzma2", ".tar.lz4c", ".node",
        ]
        .into_iter()
        .map(String::from)
        .collect(),
    );

    // Récupère tous les fichiers/dossiers
    let entries: Vec<_> = WalkDir::new(src)
        .into_iter()
        .filter_map(Result::ok)
        .collect();
    let total = entries.len() as u32;

    let counter = Arc::new(AtomicU32::new(0));
    let last_pct = Arc::new(Mutex::new(0u32));
    let window_arc = Arc::new(window.clone());

    // Parcours parallèle
    let diagnostics: Vec<DiagnosticEntry> = entries
        .into_par_iter()
        .map(|entry| {
            let path = entry.path().to_path_buf();
            let rel = path
                .strip_prefix(src)
                .unwrap_or(&path)
                .to_string_lossy()
                .to_string();
            let mut matches: Vec<MatchInfo> = Vec::new();

            if entry.file_type().is_dir() {
                if let Some(name) = path.file_name().map(|n| n.to_string_lossy()) {
                    for wp in pairs {
                        if name.contains(&wp.old) {
                            matches.push(MatchInfo {
                                term: wp.old.clone(),
                                count: None,
                            });
                        }
                    }
                }
            } else if entry.file_type().is_file() && !fm.is_ignored(&path) {
                let content = fs::read_to_string(&path).unwrap_or_default();
                for wp in pairs {
                    let cnt = content.matches(&wp.old).count();
                    if cnt > 0 {
                        matches.push(MatchInfo {
                            term: wp.old.clone(),
                            count: Some(cnt),
                        });
                    }
                }
            }

            // Calcul de l’avancement en %
            let processed = counter.fetch_add(1, Ordering::SeqCst) + 1;
            let pct = (processed * 100) / total;

            // Émet tous les 5 % (et à 100 %)
            if pct == 100 || pct % 1 == 0 {
                let mut last = last_pct.lock().unwrap();
                if *last != pct {
                    let _ = window_arc.emit("diagnose-progress", pct);
                    *last = pct;
                }
            }

            DiagnosticEntry {
                path: rel,
                is_dir: entry.file_type().is_dir(),
                matches,
            }
        })
        .collect();

    Ok(diagnostics)
}
