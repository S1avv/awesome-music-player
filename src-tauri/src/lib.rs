pub mod commands;

use commands::disk::*;
use commands::library::*;
use commands::folders::*;
use tauri::{Manager, WindowEvent, Emitter};
use tauri::tray::{TrayIconBuilder, MouseButton, MouseButtonState, TrayIconEvent};
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};

#[tauri::command]
fn update_tray_text(app_handle: tauri::AppHandle, text: String) {
    if let Some(tray) = app_handle.tray_by_id("main") {
        let _ = tray.set_tooltip(Some(text));
    }
}

#[tauri::command]
fn update_tray_menu(app_handle: tauri::AppHandle, play_pause: String, next: String, prev: String, show: String, quit: String) -> Result<(), String> {
    if let Some(tray) = app_handle.tray_by_id("main") {
        let play_pause_i = MenuItem::with_id(&app_handle, "play_pause", &play_pause, true, None::<&str>).map_err(|e| e.to_string())?;
        let next_i = MenuItem::with_id(&app_handle, "next", &next, true, None::<&str>).map_err(|e| e.to_string())?;
        let prev_i = MenuItem::with_id(&app_handle, "prev", &prev, true, None::<&str>).map_err(|e| e.to_string())?;
        let show_i = MenuItem::with_id(&app_handle, "show", &show, true, None::<&str>).map_err(|e| e.to_string())?;
        let quit_i = MenuItem::with_id(&app_handle, "quit", &quit, true, None::<&str>).map_err(|e| e.to_string())?;
        
        let menu = Menu::with_items(
            &app_handle,
            &[
                &play_pause_i,
                &next_i,
                &prev_i,
                &PredefinedMenuItem::separator(&app_handle).map_err(|e| e.to_string())?,
                &show_i,
                &quit_i,
            ],
        ).map_err(|e| e.to_string())?;

        let _ = tray.set_menu(Some(menu));
    }
    Ok(())
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            
            let metadata = crate::commands::library::MetadataOverrides::load(app.handle().clone());
            app.manage(std::sync::Arc::new(std::sync::Mutex::new(metadata)));

            let play_pause_i = MenuItem::with_id(app, "play_pause", "Play / Pause", true, None::<&str>)?;
            let next_i = MenuItem::with_id(app, "next", "Next Track", true, None::<&str>)?;
            let prev_i = MenuItem::with_id(app, "prev", "Previous Track", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Show App", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            
            let menu = Menu::with_items(
                app,
                &[
                    &play_pause_i,
                    &next_i,
                    &prev_i,
                    &PredefinedMenuItem::separator(app)?,
                    &show_i,
                    &quit_i,
                ],
            )?;

            let _tray = TrayIconBuilder::with_id("main")
                .tooltip("Mucis")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(move |app_handle, event| {
                    match event.id.as_ref() {
                        "play_pause" => { let _ = app_handle.emit("tray_play_pause", ()); }
                        "next" => { let _ = app_handle.emit("tray_next", ()); }
                        "prev" => { let _ = app_handle.emit("tray_prev", ()); }
                        "show" => {
                            if let Some(window) = app_handle.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "quit" => {
                            app_handle.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                window.hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            get_disk_space,
            count_local_tracks,
            copy_tracks,
            delete_track,
            scan_local_tracks,
            get_folders,
            open_folder_in_explorer,
            create_folder,
            rename_folder,
            get_track_cover,
            update_track_metadata,
            move_track,
            download_image_to_temp,
            increment_play_count,
            update_tray_text,
            update_tray_menu
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
