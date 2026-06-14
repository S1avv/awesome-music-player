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

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  cover_path?: string;
  tracks: string[];
  created_at: number;
}

interface LibraryContextType {
  tracks: Track[];
  playlists: Playlist[];
  isScanning: boolean;
  isInitialized: boolean;
  diskSpace: DiskSpaceResult | null;
  scanLibrary: () => Promise<void>;
  fetchDiskSpace: () => Promise<void>;
  incrementPlayCount: (path: string) => Promise<void>;
  fetchPlaylists: () => Promise<void>;
  createPlaylist: (name: string, description?: string, coverPath?: string) => Promise<Playlist>;
  updatePlaylist: (id: string, name: string, description?: string, coverPath?: string) => Promise<Playlist>;
  deletePlaylist: (id: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, trackPath: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackPath: string) => Promise<void>;
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
  
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem('mucis_library_playlists');
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

  const fetchPlaylists = useCallback(async () => {
    try {
      const result = await invoke<Playlist[]>("get_playlists");
      
      // We always inject a "Main" logical playlist for ALL tracks in UI
      const mainPlaylist: Playlist = {
        id: "main_library",
        name: "All Tracks",
        description: "Your complete library",
        tracks: [], // special case, not needed
        created_at: 0
      };
      
      const allPlaylists = [mainPlaylist, ...result];
      setPlaylists(allPlaylists);
      try { localStorage.setItem('mucis_library_playlists', JSON.stringify(allPlaylists)); } catch (e) {}
    } catch (err) {
      console.error("Failed to fetch playlists:", err);
    }
  }, []);

  const scanLibrary = useCallback(async () => {
    if (!libraryPath) {
      setTracks([]);
      return;
    }
    
    setIsScanning(true);
    try {
      const result = await invoke<Track[]>("scan_local_tracks", { path: libraryPath });
      setTracks(result);
      try { localStorage.setItem('mucis_library_tracks', JSON.stringify(result)); } catch (e) { console.warn('Failed to cache tracks', e); }
      trackCountRef.current = result.length;
      
      await fetchPlaylists();
    } catch (error) {
      console.error("Failed to scan library:", error);
      setTracks([]);
    } finally {
      setIsScanning(false);
    }
  }, [libraryPath, fetchPlaylists]);

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
        
        if (trackCountRef.current >= 0 && count > trackCountRef.current) {
          const diff = count - trackCountRef.current;
          showNotification(t.library.newTracks.replace("{count}", diff.toString()), "success");
          scanLibrary();
          fetchDiskSpace();
        } else if (trackCountRef.current >= 0 && count < trackCountRef.current) {
          const diff = trackCountRef.current - count;
          showNotification(t.library.tracksRemoved.replace("{count}", diff.toString()), "warning");
          scanLibrary();
          fetchDiskSpace();
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

  const createPlaylist = async (name: string, description?: string, coverPath?: string) => {
    try {
      const result = await invoke<Playlist>("create_playlist", { name, description, coverPath });
      await fetchPlaylists();
      return result;
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  };

  const updatePlaylist = async (id: string, name: string, description?: string, coverPath?: string) => {
    try {
      const result = await invoke<Playlist>("update_playlist", { id, name, description, coverPath });
      await fetchPlaylists();
      return result;
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  };

  const deletePlaylist = async (id: string) => {
    try {
      await invoke("delete_playlist", { id });
      await fetchPlaylists();
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  };

  const addTrackToPlaylist = async (playlistId: string, trackPath: string) => {
    try {
      await invoke("add_track_to_playlist", { playlistId, trackPath });
      await fetchPlaylists();
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  };

  const removeTrackFromPlaylist = async (playlistId: string, trackPath: string) => {
    try {
      await invoke("remove_track_from_playlist", { playlistId, trackPath });
      await fetchPlaylists();
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  };

  return (
    <LibraryContext.Provider value={{ 
      tracks, 
      playlists, 
      isScanning, 
      isInitialized: trackCountRef.current !== -1, 
      diskSpace, 
      scanLibrary, 
      fetchDiskSpace, 
      incrementPlayCount,
      fetchPlaylists,
      createPlaylist,
      updatePlaylist,
      deletePlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist
    }}>
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
