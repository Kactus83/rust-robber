//! Commande Tauri exposée : exécute le traitement complet "Project Robber".

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
    // on lance en tâche de fond et on récupère le nombre réellement traités
    let processed_count = tauri::async_runtime::spawn_blocking(move || {
        run_robber_sync(&window_bg, config)
    })
    .await
    .map_err(|e| e.to_string())??;

    Ok(format!("{} fichiers traités", processed_count))
}

fn run_robber_sync(window: &Window, config: ProcessConfig) -> Result<u32, String> {
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
        let f = dest_root.join(name);
        fs::create_dir_all(&f).map_err(|e| e.to_string())?;
        f
    } else {
        dest_root.clone()
    };

    // 2. Copie initiale
    let fm = FileManager::new(vec![
        ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".woff2", ".exe", ".dll",
        ".dmg", ".zip", ".tar", ".gz", ".bz2", ".xz", ".7z", ".rar",
        ".tar.gz", ".tar.bz2", ".tar.xz", ".tar.7z", ".tar.rar",
        ".tar.lz", ".tar.lzma", ".tar.lzo", ".tar.lzop",
        ".tar.lz4", ".tar.lzip", ".tar.lzma2", ".tar.lz4c", ".node",
    ].into_iter().map(String::from).collect());
    fm.copy_all(&src, &dest).map_err(|e| e.to_string())?;

    // 3. Préparation des paires
    let mut pairs: Vec<WordPair> = config.pairs.clone();
    if config.variants {
        pairs = TextService::expand_variants(&pairs);
    }

    // 4. Construction de la liste brute des fichiers à traiter
    let mut file_list: Vec<PathBuf> = if let Some(rel_paths) = config.filter_paths {
        rel_paths.into_iter()
            .map(|rel| dest.join(rel))
            .filter(|path| path.is_file() && !fm.is_ignored(path))
            .collect()
    } else {
        WalkDir::new(&dest)
            .into_iter()
            .filter_map(Result::ok)
            .filter(|e| e.file_type().is_file() && !fm.is_ignored(e.path()))
            .map(|e| e.into_path())
            .collect()
    };

    // 5. Filtrage strict : ne garder que les fichiers qui contiennent effectivement
    //    au moins une occurrence d’un terme “old” dans leur contenu.
    file_list.retain(|path| {
        // Lecture sûre : si erreur, on exclut
        if let Ok(content) = fs::read_to_string(path) {
            pairs.iter().any(|wp| content.contains(&wp.old))
        } else {
            false
        }
    });

    let total = file_list.len() as u32;
    let counter = Arc::new(AtomicU32::new(0));
    let last_pct = Arc::new(Mutex::new(0u32));
    let window_arc = Arc::new(window.clone());

    // 6. Traitement parallèle + émission de progression
    file_list
        .into_par_iter()
        .for_each(|path| {
            let _ = TextService::replace_in_file(&path, &pairs);
            let processed = counter.fetch_add(1, Ordering::SeqCst) + 1;
            let pct = (processed * 100) / total;
            let mut last = last_pct.lock().unwrap();
            if *last != pct {
                let _ = window_arc.emit("robber-progress", pct);
                *last = pct;
            }
        });

    // 7. Renommage final
    if config.rename {
        Renamer::rename_all(&dest, &pairs).map_err(|e| e.to_string())?;
    }

    Ok(total)
}
