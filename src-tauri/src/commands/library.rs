use serde::{Deserialize, Serialize};
use walkdir::WalkDir;
use lofty::read_from_path;
use lofty::tag::Accessor;
use lofty::file::{TaggedFileExt, AudioFile};
use base64::{engine::general_purpose, Engine as _};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager};

#[derive(Serialize, Deserialize, Clone, Default)]
pub struct TrackOverride {
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub cover_path: Option<String>,
    pub play_count: Option<u64>,
}

#[derive(Serialize, Deserialize, Default)]
pub struct MetadataOverrides {
    pub tracks: HashMap<String, TrackOverride>,
}

impl MetadataOverrides {
    pub fn load(app: AppHandle) -> Self {
        if let Ok(dir) = app.path().app_data_dir() {
            let path = dir.join("metadata.json");
            if let Ok(data) = std::fs::read_to_string(path) {
                if let Ok(overrides) = serde_json::from_str(&data) {
                    return overrides;
                }
            }
        }
        Self::default()
    }

    pub fn save(&self, app: &AppHandle) -> Result<(), String> {
        if let Ok(dir) = app.path().app_data_dir() {
            std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
            let path = dir.join("metadata.json");
            let data = serde_json::to_string_pretty(self).map_err(|e| e.to_string())?;
            std::fs::write(path, data).map_err(|e| e.to_string())?;
        }
        Ok(())
    }
}

#[derive(Serialize, Deserialize)]
pub struct Track {
    pub id: String,
    pub title: String,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub path: String,
    pub duration: Option<u64>,
    pub added_at: u64,
    pub play_count: u64,
}

#[tauri::command]
pub fn count_local_tracks(path: String) -> Result<usize, String> {
    if path.is_empty() {
        return Ok(0);
    }

    let extensions = ["mp3", "wav", "flac", "m4a"];
    let count = WalkDir::new(&path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|entry| {
            let path_obj = entry.path();
            if path_obj.is_file() {
                if let Some(ext) = path_obj.extension().and_then(|e| e.to_str()) {
                    return extensions.contains(&ext.to_lowercase().as_str());
                }
            }
            false
        })
        .count();

    Ok(count)
}

#[tauri::command]
pub fn copy_tracks(files: Vec<String>, dest_folder: String) -> Result<usize, String> {
    let mut count = 0;
    let dest_path = std::path::Path::new(&dest_folder);
    if !dest_path.exists() {
        return Err("Destination folder does not exist".into());
    }

    for file in files {
        let path = std::path::Path::new(&file);
        if path.is_file() {
            if let Some(file_name) = path.file_name() {
                let dest_file = dest_path.join(file_name);
                if std::fs::copy(&path, &dest_file).is_ok() {
                    count += 1;
                }
            }
        }
    }
    
    Ok(count)
}

#[tauri::command]
pub fn delete_track(path: String) -> Result<(), String> {
    let p = std::path::Path::new(&path);
    if p.exists() && p.is_file() {
        std::fs::remove_file(p).map_err(|e| e.to_string())?;
    } else {
        return Err("File does not exist or is not a file".into());
    }
    Ok(())
}

#[tauri::command]
pub fn scan_local_tracks(path: String, state: tauri::State<'_, Arc<Mutex<MetadataOverrides>>>) -> Result<Vec<Track>, String> {
    if path.is_empty() {
        return Ok(Vec::new());
    }

    let mut tracks = Vec::new();
    let extensions = ["mp3", "wav", "flac", "m4a"];

    for entry in WalkDir::new(&path).into_iter().filter_map(|e| e.ok()) {
        let path_obj = entry.path();
        if path_obj.is_file() {
            if let Some(ext) = path_obj.extension().and_then(|e| e.to_str()) {
                if extensions.contains(&ext.to_lowercase().as_str()) {
                    let full_path = path_obj.to_string_lossy().to_string();
                    
                    let mut file_title = path_obj
                        .file_stem()
                        .and_then(|n| n.to_str())
                        .unwrap_or("Unknown Track")
                        .to_string();
                    let mut track_artist = None;
                    let mut track_album = None;
                    let mut track_duration = None;

                    if let Ok(tagged_file) = read_from_path(path_obj) {
                        let properties = tagged_file.properties();
                        track_duration = Some(properties.duration().as_secs());

                        if let Some(tag) = tagged_file.primary_tag() {
                            if let Some(t) = tag.title() {
                                if !t.is_empty() {
                                    file_title = t.into_owned();
                                }
                            }
                            if let Some(a) = tag.artist() {
                                if !a.is_empty() {
                                    track_artist = Some(a.into_owned());
                                }
                            }
                            if let Some(al) = tag.album() {
                                if !al.is_empty() {
                                    track_album = Some(al.into_owned());
                                }
                            }
                        } else if let Some(tag) = tagged_file.first_tag() {
                            if let Some(t) = tag.title() {
                                if !t.is_empty() {
                                    file_title = t.into_owned();
                                }
                            }
                            if let Some(a) = tag.artist() {
                                if !a.is_empty() {
                                    track_artist = Some(a.into_owned());
                                }
                            }
                            if let Some(al) = tag.album() {
                                if !al.is_empty() {
                                    track_album = Some(al.into_owned());
                                }
                            }
                        }
                    }
                    let added_at = std::fs::metadata(path_obj)
                        .and_then(|m| m.created().or_else(|_| m.modified()))
                        .map(|t| t.duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs())
                        .unwrap_or(0);

                    let mut track_play_count = 0;

                    if let Ok(overrides) = state.lock() {
                        if let Some(o) = overrides.tracks.get(&full_path) {
                            if let Some(t) = &o.title { file_title = t.clone(); }
                            if o.artist.is_some() { track_artist = o.artist.clone(); }
                            if o.album.is_some() { track_album = o.album.clone(); }
                            if let Some(pc) = o.play_count { track_play_count = pc; }
                        }
                    }

                    tracks.push(Track {
                        id: full_path.clone(), // using path as unique ID
                        title: file_title,
                        artist: track_artist,
                        album: track_album,
                        path: full_path,
                        duration: track_duration,
                        added_at,
                        play_count: track_play_count,
                    });
                }
            }
        }
    }

    Ok(tracks)
}

#[tauri::command]
pub fn get_track_cover(path: String, state: tauri::State<'_, Arc<Mutex<MetadataOverrides>>>) -> Result<Option<String>, String> {
    if let Ok(overrides) = state.lock() {
        if let Some(o) = overrides.tracks.get(&path) {
            if let Some(c_path) = &o.cover_path {
                if let Ok(data) = std::fs::read(c_path) {
                    let mime_str = if c_path.to_lowercase().ends_with(".png") { "image/png" } else { "image/jpeg" };
                    let b64 = general_purpose::STANDARD.encode(&data);
                    return Ok(Some(format!("data:{};base64,{}", mime_str, b64)));
                }
            }
        }
    }

    let tagged_file = read_from_path(&path).map_err(|e| e.to_string())?;
    
    let tag = tagged_file.primary_tag().or_else(|| tagged_file.first_tag());
    if let Some(t) = tag {
        if let Some(pic) = t.pictures().first() {
            let mime_str = match pic.mime_type() {
                Some(m) => m.as_str().to_string(),
                None => "image/jpeg".to_string(),
            };
            let data = pic.data();
            let b64 = general_purpose::STANDARD.encode(data);
            return Ok(Some(format!("data:{};base64,{}", mime_str, b64)));
        }
    }
    
    Ok(None)
}

#[tauri::command]
pub fn update_track_metadata(path: String, title: String, artist: String, album: String, cover_path: Option<String>, app: tauri::AppHandle, state: tauri::State<'_, Arc<Mutex<MetadataOverrides>>>) -> Result<(), String> {
    if let Ok(mut overrides) = state.lock() {
        let entry = overrides.tracks.entry(path.clone()).or_insert_with(TrackOverride::default);
        entry.title = Some(title);
        entry.artist = Some(artist);
        entry.album = Some(album);
        
        if let Some(c_path) = cover_path {
            if let Ok(dir) = app.path().app_data_dir() {
                let covers_dir = dir.join("covers");
                let _ = std::fs::create_dir_all(&covers_dir);
                let ext = if c_path.to_lowercase().ends_with(".png") { "png" } else { "jpg" };
                // Generate unique filename based on hash or timestamp
                let filename = format!("cover_{}.{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis(), ext);
                let dest_path = covers_dir.join(filename);
                
                if std::fs::copy(&c_path, &dest_path).is_ok() {
                    entry.cover_path = Some(dest_path.to_string_lossy().to_string());
                } else {
                    entry.cover_path = Some(c_path);
                }
            } else {
                entry.cover_path = Some(c_path);
            }
        }
        
        // Save to disk
        overrides.save(&app)?;
    }
    Ok(())
}

#[tauri::command]
pub fn move_track(path: String, new_folder: String, app: tauri::AppHandle, state: tauri::State<'_, Arc<Mutex<MetadataOverrides>>>) -> Result<String, String> {
    let source = std::path::Path::new(&path);
    let target_dir = std::path::Path::new(&new_folder);
    
    if !source.exists() || !source.is_file() {
        return Err("Source file does not exist".to_string());
    }
    
    if !target_dir.exists() {
        std::fs::create_dir_all(&target_dir).map_err(|e| e.to_string())?;
    }
    
    let file_name = source.file_name().ok_or("Invalid file name")?;
    let target_path = target_dir.join(file_name);
    
    std::fs::rename(&source, &target_path).map_err(|e| e.to_string())?;
    
    let new_path_str = target_path.to_string_lossy().to_string();
    
    if let Ok(mut overrides) = state.lock() {
        if let Some(track_override) = overrides.tracks.remove(&path) {
            overrides.tracks.insert(new_path_str.clone(), track_override);
            let _ = overrides.save(&app);
        }
    }
    
    Ok(new_path_str)
}

#[tauri::command]
pub fn download_image_to_temp(url: String) -> Result<String, String> {
    let response = ureq::get(&url).call().map_err(|e| e.to_string())?;
    
    let mut reader = response.into_reader();
    
    // Generate a temp file name
    let temp_dir = std::env::temp_dir();
    let file_name = format!("mucis_cover_{}.jpg", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis());
    let file_path = temp_dir.join(file_name);
    
    let mut file = std::fs::File::create(&file_path).map_err(|e| e.to_string())?;
    std::io::copy(&mut reader, &mut file).map_err(|e| e.to_string())?;
    
    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn increment_play_count(path: String, app: tauri::AppHandle, state: tauri::State<'_, Arc<Mutex<MetadataOverrides>>>) -> Result<(), String> {
    if let Ok(mut overrides) = state.lock() {
        let entry = overrides.tracks.entry(path).or_insert_with(TrackOverride::default);
        entry.play_count = Some(entry.play_count.unwrap_or(0) + 1);
        let _ = overrides.save(&app);
    }
    Ok(())
}
