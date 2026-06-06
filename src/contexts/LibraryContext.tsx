import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSettings } from "../hooks/useSettings";
import { useNotification } from "./NotificationContext";
import { useTranslation } from "../i18n";

export interface Track {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  path: string;
  duration?: number;
  added_at: number;
  play_count: number;
}

export interface DiskSpaceResult {
  total_space: number;
  used_space: number;
}

export interface Collection {
  id: string;
  name: string;
  trackCount: number;
  image: string;
}

interface LibraryContextType {
  tracks: Track[];
  collections: Collection[];
  isScanning: boolean;
  isInitialized: boolean;
  diskSpace: DiskSpaceResult | null;
  scanLibrary: () => Promise<void>;
  fetchDiskSpace: () => Promise<void>;
  incrementPlayCount: (path: string) => Promise<void>;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { libraryPath } = useSettings();
  const [tracks, setTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem('mucis_library_tracks');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });
  const [collections, setCollections] = useState<Collection[]>(() => {
    const saved = localStorage.getItem('mucis_library_collections');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });
  const [isScanning, setIsScanning] = useState(false);
  const [diskSpace, setDiskSpace] = useState<DiskSpaceResult | null>(null);
  
  const { showNotification } = useNotification();
  const { t } = useTranslation();
  const trackCountRef = useRef<number>(-1);

  const scanLibrary = useCallback(async () => {
    if (!libraryPath) {
      setTracks([]);
      return;
    }
    
    setIsScanning(true);
    try {
      const result = await invoke<Track[]>("scan_local_tracks", { path: libraryPath });
      const folders = await invoke<string[]>("get_folders", { path: libraryPath });
      
      setTracks(result);
      try { localStorage.setItem('mucis_library_tracks', JSON.stringify(result)); } catch (e) { console.warn('Failed to cache tracks', e); }
      trackCountRef.current = result.length;
      
      const collectionsMap = new Map<string, Collection>();
      
      // Always add the "Main" collection first for ALL tracks in the library
      collectionsMap.set("main_library", {
        id: "main_library",
        name: "All Tracks",
        trackCount: result.length,
        image: "/PhonographRecord.png"
      });

      // Add all physical subfolders first
      folders.forEach(folderPath => {
        const parts = folderPath.split(/[/\\]/);
        const folderName = parts[parts.length - 1]; // Because get_folders returns the full path to the directory
        collectionsMap.set(folderPath.replace(/\\/g, '/'), {
          id: folderPath.replace(/\\/g, '/'),
          name: folderName,
          trackCount: 0,
          image: "/PhonographRecord.png"
        });
      });

      result.forEach(track => {
        // Extraction of parent folder name from path
        const parts = track.path.split(/[/\\]/);
        if (parts.length > 1) {
          const folderName = parts[parts.length - 2];
          const folderPath = parts.slice(0, -1).join('/');
          
          // Don't create a separate collection if the parent folder IS the library folder
          const normalizedFolderPath = folderPath.replace(/\\/g, '/').toLowerCase();
          const normalizedLibraryPath = libraryPath.replace(/\\/g, '/').toLowerCase();
          
          if (normalizedFolderPath !== normalizedLibraryPath) {
            // Find in map ignoring cases/slashes
            let foundKey = folderPath.replace(/\\/g, '/');
            for (const key of collectionsMap.keys()) {
              if (key.toLowerCase() === normalizedFolderPath) {
                foundKey = key;
                break;
              }
            }
            
            if (collectionsMap.has(foundKey)) {
              collectionsMap.get(foundKey)!.trackCount++;
            } else {
              collectionsMap.set(foundKey, {
                id: foundKey,
                name: folderName,
                trackCount: 1,
                image: "/PhonographRecord.png"
              });
            }
          }
        }
      });
      
      const collectionsArray = Array.from(collectionsMap.values());
      setCollections(collectionsArray);
      try { localStorage.setItem('mucis_library_collections', JSON.stringify(collectionsArray)); } catch (e) { console.warn('Failed to cache collections', e); }

    } catch (error) {
      console.error("Failed to scan library:", error);
      setTracks([]);
      setCollections([]);
    } finally {
      setIsScanning(false);
    }
  }, [libraryPath]);

  const fetchDiskSpace = useCallback(async () => {
    try {
      const result = await invoke<DiskSpaceResult>("get_disk_space", { path: libraryPath || "" });
      setDiskSpace(result);
    } catch (error) {
      console.error("Failed to get disk space:", error);
    }
  }, [libraryPath]);

  // Initial load
  useEffect(() => {
    scanLibrary();
    fetchDiskSpace();
  }, [scanLibrary, fetchDiskSpace]);

  // Auto-scan optimizer effect
  useEffect(() => {
    if (!libraryPath || isScanning) return;

    const interval = setInterval(async () => {
      try {
        const count = await invoke<number>("count_local_tracks", { path: libraryPath });
        
        // If trackCountRef is -1, it means we haven't done the initial load yet.
        if (trackCountRef.current >= 0 && count > trackCountRef.current) {
          const diff = count - trackCountRef.current;
          showNotification(t.library.newTracks.replace("{count}", diff.toString()), "success");
          scanLibrary(); // Trigger a full scan to load metadata
          fetchDiskSpace(); // Update disk space info
        } else if (trackCountRef.current >= 0 && count < trackCountRef.current) {
          const diff = trackCountRef.current - count;
          showNotification(t.library.tracksRemoved.replace("{count}", diff.toString()), "warning");
          scanLibrary();
          fetchDiskSpace(); // Update disk space info
        }
        
        trackCountRef.current = count;
      } catch (e) {
        console.error("Auto-scan error:", e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [libraryPath, isScanning, showNotification, scanLibrary, fetchDiskSpace, t]);

  const incrementPlayCount = async (path: string) => {
    try {
      await invoke("increment_play_count", { path });
      setTracks(prev => {
        const updated = prev.map(t => t.path === path ? { ...t, play_count: t.play_count + 1 } : t);
        try { localStorage.setItem('mucis_library_tracks', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
    } catch (err) {
      console.error("Failed to increment play count:", err);
    }
  };

  return (
    <LibraryContext.Provider value={{ tracks, collections, isScanning, isInitialized: trackCountRef.current !== -1, diskSpace, scanLibrary, fetchDiskSpace, incrementPlayCount }}>
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error("useLibrary must be used within a LibraryProvider");
  }
  return context;
}
