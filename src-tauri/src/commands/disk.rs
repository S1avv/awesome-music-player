use serde::{Deserialize, Serialize};
use sysinfo::Disks;

#[derive(Serialize, Deserialize)]
pub struct DiskSpaceResult {
    pub total_space: u64,
    pub used_space: u64,
}

#[tauri::command]
pub fn get_disk_space(path: String) -> Result<DiskSpaceResult, String> {
    let disks = Disks::new_with_refreshed_list();
    
    // If no path is provided, find the primary disk
    // For specific path, find the disk where the path mounts
    
    for disk in disks.list() {
        if path.is_empty() {
            // Return first non-removable disk
            return Ok(DiskSpaceResult {
                total_space: disk.total_space(),
                used_space: disk.total_space() - disk.available_space(),
            });
        }

        // In Windows, if the path starts with the disk mount point (e.g., "D:\")
        let mount_point = disk.mount_point().to_string_lossy().to_string();
        if path.starts_with(&mount_point) {
            return Ok(DiskSpaceResult {
                total_space: disk.total_space(),
                used_space: disk.total_space() - disk.available_space(),
            });
        }
    }
    
    // Fallback if not found
    if let Some(disk) = disks.list().first() {
        return Ok(DiskSpaceResult {
            total_space: disk.total_space(),
            used_space: disk.total_space() - disk.available_space(),
        });
    }

    Err("Could not read disk space".into())
}
