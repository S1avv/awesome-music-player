use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Serialize, Deserialize, Clone)]
pub struct LogicalPlaylist {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub cover_path: Option<String>,
    pub tracks: Vec<String>,
    pub created_at: u64,
}

#[derive(Serialize, Deserialize, Default)]
pub struct PlaylistManager {
    pub playlists: HashMap<String, LogicalPlaylist>,
}

impl PlaylistManager {
    pub fn load(app: AppHandle) -> Self {
        if let Ok(dir) = app.path().app_data_dir() {
            let path = dir.join("playlists.json");
            if let Ok(data) = std::fs::read_to_string(path) {
                if let Ok(manager) = serde_json::from_str(&data) {
                    return manager;
                }
            }
        }
        Self::default()
    }

    pub fn save(&self, app: &AppHandle) -> Result<(), String> {
        if let Ok(dir) = app.path().app_data_dir() {
            std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
            let path = dir.join("playlists.json");
            let data = serde_json::to_string_pretty(self).map_err(|e| e.to_string())?;
            std::fs::write(path, data).map_err(|e| e.to_string())?;
        }
        Ok(())
    }
}

fn get_timestamp() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs()
}

#[tauri::command]
pub fn get_playlists(state: tauri::State<'_, Arc<Mutex<PlaylistManager>>>) -> Result<Vec<LogicalPlaylist>, String> {
    if let Ok(manager) = state.lock() {
        let mut list: Vec<LogicalPlaylist> = manager.playlists.values().cloned().collect();
        // Sort by created_at ascending
        list.sort_by(|a, b| a.created_at.cmp(&b.created_at));
        Ok(list)
    } else {
        Err("Failed to acquire lock".into())
    }
}

#[tauri::command]
pub fn create_playlist(
    name: String,
    description: Option<String>,
    cover_path: Option<String>,
    app: AppHandle,
    state: tauri::State<'_, Arc<Mutex<PlaylistManager>>>
) -> Result<LogicalPlaylist, String> {
    let mut manager = state.lock().map_err(|_| "Failed to acquire lock")?;
    
    // Generate an ID (e.g., lowercase name + timestamp to ensure uniqueness)
    let id = format!("{}_{}", name.to_lowercase().replace(" ", "_").replace(|c: char| !c.is_alphanumeric() && c != '_', ""), get_timestamp());
    
    let mut final_cover_path = cover_path.clone();
    
    // If a custom cover is provided, we should ideally copy it to our app data dir to prevent it from being deleted by the user accidentally.
    if let Some(c_path) = cover_path {
        if let Ok(dir) = app.path().app_data_dir() {
            let covers_dir = dir.join("covers");
            let _ = std::fs::create_dir_all(&covers_dir);
            let ext = if c_path.to_lowercase().ends_with(".png") { "png" } else { "jpg" };
            let filename = format!("playlist_cover_{}.{}", get_timestamp(), ext);
            let dest_path = covers_dir.join(filename);
            
            if std::fs::copy(&c_path, &dest_path).is_ok() {
                final_cover_path = Some(dest_path.to_string_lossy().to_string());
            }
        }
    }

    let playlist = LogicalPlaylist {
        id: id.clone(),
        name,
        description,
        cover_path: final_cover_path,
        tracks: Vec::new(),
        created_at: get_timestamp(),
    };

    manager.playlists.insert(id, playlist.clone());
    manager.save(&app)?;

    Ok(playlist)
}

#[tauri::command]
pub fn update_playlist(
    id: String,
    name: String,
    description: Option<String>,
    cover_path: Option<String>,
    app: AppHandle,
    state: tauri::State<'_, Arc<Mutex<PlaylistManager>>>
) -> Result<LogicalPlaylist, String> {
    let mut manager = state.lock().map_err(|_| "Failed to acquire lock")?;
    
    if let Some(playlist) = manager.playlists.get_mut(&id) {
        playlist.name = name;
        playlist.description = description;
        
        if let Some(c_path) = cover_path {
            if c_path != playlist.cover_path.clone().unwrap_or_default() {
                // New cover
                if let Ok(dir) = app.path().app_data_dir() {
                    let covers_dir = dir.join("covers");
                    let _ = std::fs::create_dir_all(&covers_dir);
                    let ext = if c_path.to_lowercase().ends_with(".png") { "png" } else { "jpg" };
                    let filename = format!("playlist_cover_{}.{}", get_timestamp(), ext);
                    let dest_path = covers_dir.join(filename);
                    
                    if std::fs::copy(&c_path, &dest_path).is_ok() {
                        playlist.cover_path = Some(dest_path.to_string_lossy().to_string());
                    } else {
                        playlist.cover_path = Some(c_path);
                    }
                }
            }
        }
        
        let updated = playlist.clone();
        manager.save(&app)?;
        Ok(updated)
    } else {
        Err("Playlist not found".into())
    }
}

#[tauri::command]
pub fn delete_playlist(
    id: String,
    app: AppHandle,
    state: tauri::State<'_, Arc<Mutex<PlaylistManager>>>
) -> Result<(), String> {
    let mut manager = state.lock().map_err(|_| "Failed to acquire lock")?;
    
    if manager.playlists.remove(&id).is_some() {
        manager.save(&app)?;
        Ok(())
    } else {
        Err("Playlist not found".into())
    }
}

#[tauri::command]
pub fn add_track_to_playlist(
    playlist_id: String,
    track_path: String,
    app: AppHandle,
    state: tauri::State<'_, Arc<Mutex<PlaylistManager>>>
) -> Result<(), String> {
    let mut manager = state.lock().map_err(|_| "Failed to acquire lock")?;
    
    if let Some(playlist) = manager.playlists.get_mut(&playlist_id) {
        if !playlist.tracks.contains(&track_path) {
            playlist.tracks.push(track_path);
            manager.save(&app)?;
        }
        Ok(())
    } else {
        Err("Playlist not found".into())
    }
}

#[tauri::command]
pub fn remove_track_from_playlist(
    playlist_id: String,
    track_path: String,
    app: AppHandle,
    state: tauri::State<'_, Arc<Mutex<PlaylistManager>>>
) -> Result<(), String> {
    let mut manager = state.lock().map_err(|_| "Failed to acquire lock")?;
    
    if let Some(playlist) = manager.playlists.get_mut(&playlist_id) {
        playlist.tracks.retain(|p| p != &track_path);
        manager.save(&app)?;
        Ok(())
    } else {
        Err("Playlist not found".into())
    }
}

#[tauri::command]
pub fn reorder_playlist_tracks(
    playlist_id: String,
    new_tracks: Vec<String>,
    app: AppHandle,
    state: tauri::State<'_, Arc<Mutex<PlaylistManager>>>
) -> Result<(), String> {
    let mut manager = state.lock().map_err(|_| "Failed to acquire lock")?;
    
    if let Some(playlist) = manager.playlists.get_mut(&playlist_id) {
        playlist.tracks = new_tracks;
        manager.save(&app)?;
        Ok(())
    } else {
        Err("Playlist not found".into())
    }
}
