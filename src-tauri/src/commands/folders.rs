use std::path::Path;
use std::fs;
use std::process::Command;

#[tauri::command]
pub fn get_folders(path: &str) -> Vec<String> {
    let mut folders = Vec::new();
    let root = Path::new(path);
    if root.exists() && root.is_dir() {
        if let Ok(entries) = fs::read_dir(root) {
            for entry in entries.filter_map(|e| e.ok()) {
                if let Ok(file_type) = entry.file_type() {
                    if file_type.is_dir() {
                        let folder_path = entry.path().to_string_lossy().to_string();
                        folders.push(folder_path);
                    }
                }
            }
        }
    }
    folders
}

#[tauri::command]
pub fn create_folder(base_path: &str, folder_name: &str) -> Result<String, String> {
    let root = Path::new(base_path);
    let new_folder = root.join(folder_name);
    
    match fs::create_dir_all(&new_folder) {
        Ok(_) => Ok(new_folder.to_string_lossy().to_string()),
        Err(e) => Err(e.to_string())
    }
}

#[tauri::command]
pub fn rename_folder(old_path: &str, new_name: &str) -> Result<String, String> {
    let old_dir = Path::new(old_path);
    
    if !old_dir.exists() {
        return Err("Folder does not exist".into());
    }

    let parent = old_dir.parent().ok_or("Cannot rename root directory")?;
    let new_dir = parent.join(new_name);

    if new_dir.exists() {
        return Err("A folder with this name already exists".into());
    }

    match fs::rename(old_dir, &new_dir) {
        Ok(_) => Ok(new_dir.to_string_lossy().to_string()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn open_folder_in_explorer(path: &str) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(());
    }
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(());
    }
    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok(());
    }
    
    #[allow(unreachable_code)]
    Err("Unsupported OS".into())
}
