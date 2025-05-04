//! Commande Tauri exposée : exécute le traitement complet "Project Robber",
//! avec progression fidèle pendant la copie et le remplacement.

use chrono::Local;
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
use rayon::prelude::*;
use walkdir::WalkDir;

use crate::{
    config::process_config::ProcessConfig,
    services::{file_manager::FileManager, renamer::Renamer, text_service::TextService},
    types::word_pair::WordPair,
};

#[command]
pub async fn run_robber(window: Window, config: ProcessConfig) -> Result<String, String> {
    let window_bg = window.clone();
    let modified_count = tauri::async_runtime::spawn_blocking(move || {
        run_robber_sync(&window_bg, config)
    })
    .await
    .map_err(|e| e.to_string())??;

    Ok(format!("{} fichiers modifiés", modified_count))
}

fn run_robber_sync(window: &Window, config: ProcessConfig) -> Result<u32, String> {
    // 0. Démarrage à 0%
    let _ = window.emit("robber-progress", 0u32);

    // 1. Préparation des chemins
    let src = PathBuf::from(&config.source);
    let dest_root = PathBuf::from(&config.destination);
    let dest = if config.create_subfolder {
        let name = if config.use_timestamp {
            Local::now().format("%Y%m%d_%H%M%S").to_string()
        } else {
            config.folder_name.clone()
                .unwrap_or_else(|| src.file_name().unwrap().to_string_lossy().into_owned())
        };
        let folder = dest_root.join(name);
        fs::create_dir_all(&folder).map_err(|e| e.to_string())?;
        folder
    } else {
        dest_root.clone()
    };

    // 2. Initialisation du FileManager (extensions ignorées)
    let ignored_exts = vec![
        ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".woff2",
        ".exe", ".dll", ".dmg", ".zip", ".tar", ".gz", ".bz2",
        ".xz", ".7z", ".rar", ".tar.gz", ".tar.bz2", ".tar.xz",
        ".tar.7z", ".tar.rar", ".tar.lz", ".tar.lzma", ".tar.lzo",
        ".tar.lzop", ".tar.lz4", ".tar.lzip", ".tar.lzma2", ".tar.lz4c",
        ".node",
    ].into_iter().map(String::from).collect();
    let fm = FileManager::new(ignored_exts);

    // 3. Liste des fichiers à copier
    let copy_list: Vec<PathBuf> = WalkDir::new(&src)
        .into_iter()
        .filter_map(Result::ok)
        .map(|e| e.into_path())
        .collect();
    let total_copy = copy_list.len().max(1) as u32;

    // Compteurs pour la copie
    let copy_counter = Arc::new(AtomicU32::new(0));
    let copy_last = Arc::new(Mutex::new(0u32));
    let win_arc = Arc::new(window.clone());

    // 4. Copier fichier par fichier, progression 0 → 30%
    for src_path in &copy_list {
        if let Ok(rel) = src_path.strip_prefix(&src) {
            let dst_path = dest.join(rel);
            if let Some(parent) = dst_path.parent() {
                let _ = fs::create_dir_all(parent);
            }
            let _ = fs::copy(src_path, &dst_path);
        }
        let done = copy_counter.fetch_add(1, Ordering::SeqCst) + 1;
        let pct = done * 30 / total_copy;
        let mut last = copy_last.lock().unwrap();
        if *last != pct {
            let _ = win_arc.emit("robber-progress", pct);
            *last = pct;
        }
    }

    // 5. Préparation des paires de remplacement
    let mut pairs: Vec<WordPair> = config.pairs.clone();
    if config.variants {
        pairs = TextService::expand_variants(&pairs);
    }

    // 6. Liste des fichiers à remplacer
    let replace_list: Vec<PathBuf> = if let Some(rel_paths) = config.filter_paths.clone() {
        rel_paths.into_iter()
            .map(|rel| dest.join(rel))
            .filter(|p| p.is_file() && !fm.is_ignored(p))
            .collect()
    } else {
        WalkDir::new(&dest)
            .into_iter()
            .filter_map(Result::ok)
            .filter(|e| e.file_type().is_file() && !fm.is_ignored(e.path()))
            .map(|e| e.into_path())
            .collect()
    };
    let total_replace = replace_list.len().max(1) as u32;

    // Compteurs pour le remplacement
    let rep_counter = Arc::new(AtomicU32::new(0));
    let rep_modified = Arc::new(AtomicU32::new(0));
    let rep_last = Arc::new(Mutex::new(30u32));
    let win_arc2 = Arc::new(window.clone());

    // 7. Remplacement en parallèle, progression 30 → 100%
    replace_list.into_par_iter().for_each(|path| {
        if let Ok(content) = fs::read_to_string(&path) {
            if pairs.iter().any(|wp| content.contains(&wp.old)) {
                let _ = TextService::replace_in_file(&path, &pairs);
                rep_modified.fetch_add(1, Ordering::SeqCst);
            }
        }
        let done = rep_counter.fetch_add(1, Ordering::SeqCst) + 1;
        let pct = 30 + (done * 70 / total_replace);
        let mut last = rep_last.lock().unwrap();
        if *last != pct {
            let _ = win_arc2.emit("robber-progress", pct);
            *last = pct;
        }
    });

    // 8. Renommage final si demandé
    if config.rename {
        Renamer::rename_all(&dest, &pairs).map_err(|e| e.to_string())?;
    }

    // 9. Finalisation à 100%
    let _ = window.emit("robber-progress", 100u32);

    Ok(rep_modified.load(Ordering::SeqCst))
}
