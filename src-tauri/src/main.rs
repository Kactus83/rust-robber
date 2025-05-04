#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod commands;
mod config;
mod services;
mod types;

use tauri::Manager;
use tauri_plugin_log::Builder;
use commands::{robber::run_robber, diagnose::diagnose_robber};
use tauri_plugin_dialog::DialogExt;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init()) 
        .plugin(Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            run_robber,
            diagnose_robber,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
