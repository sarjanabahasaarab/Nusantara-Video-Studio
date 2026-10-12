// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

// Command to check native desktop capabilities
#[tauri::command]
fn get_system_info() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "app_name": "Nusantara Video Studio",
        "version": "1.0.0",
        "phase": 10,
        "platform": std::env::consts::OS,
        "arch": std::env::consts::ARCH,
        "desktop_ready": true,
        "schema_version": 7
    }))
}

// Command to safely inspect standard desktop user paths
#[tauri::command]
fn get_desktop_paths() -> Result<serde_json::Value, String> {
    let docs = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .unwrap_or_else(|_| ".".to_string());
    
    Ok(serde_json::json!({
        "user_home": docs,
        "app_data": format!("{}/AppData/Local/NusantaraStudio", docs),
        "projects_dir": format!("{}/Documents/NusantaraProjects", docs),
        "cache_dir": format!("{}/AppData/Local/NusantaraStudio/Cache", docs)
    }))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            get_desktop_paths
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main");
                if let Some(w) = window {
                    let _ = w.set_title("Nusantara Video Studio v1.0.0");
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Nusantara Video Studio application");
}
