#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod commands;
mod config;
mod services;
mod types;
mod state;

use tauri::Manager;
use tauri_plugin_log::Builder;
use commands::{robber::run_robber, diagnose::diagnose_robber};

fn main() {
    tauri::Builder::default()
        .plugin(Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            run_robber,
            diagnose_robber,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
