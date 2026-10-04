// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

// Command to check native desktop capabilities
#[tauri::command]
fn get_system_info() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "app_name": "Nusantara Video Studio",
        "version": "0.1.0",
        "phase": 1,
        "platform": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "desktop_ready": true
    }))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_system_info])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main");
                if let Some(w) = window {
                    let _ = w.set_title("Nusantara Video Studio");
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Nusantara Video Studio application");
}
