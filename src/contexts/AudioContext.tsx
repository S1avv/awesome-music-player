import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from "react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { readFile } from "@tauri-apps/plugin-fs";
import { Track, useLibrary } from "./LibraryContext";
import { useNotification } from "./NotificationContext";

const MIME_MAP: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  flac: "audio/flac",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
  wma: "audio/x-ms-wma",
};

function getMimeType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || "mp3";
  return MIME_MAP[ext] || "audio/mpeg";
}

function hasUnsafeChars(path: string): boolean {
  return path.includes('#') || path.includes('?');
}

let currentBlobUrl: string | null = null;

interface AudioContextType {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  volume: number;
  progress: number; // 0 to 1
  currentTime: number;
  duration: number;
  playTrack: (track: Track, newQueue?: Track[]) => void;
  repeatMode: "off" | "all" | "one";
  isShuffled: boolean;
  togglePlayPause: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (vol: number) => void;
  seek: (progress: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>(() => {
    const saved = localStorage.getItem("mucis_queue");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem("mucis_volume");
    return saved !== null ? parseFloat(saved) : 1;
  });
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("off");
  const [isShuffled, setIsShuffled] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  
  const { incrementPlayCount, tracks, isInitialized } = useLibrary();
  const { showNotification } = useNotification();
  const hasIncrementedRef = useRef(false);

  const handleNextTrackRef = useRef<() => void>();

  const handleNextTrack = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    
    if (repeatMode === "one") {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
        setProgress(0);
        setCurrentTime(0);
        setIsPlaying(true);
        incrementPlayCount(currentTrack.path);
      }
      return;
    }

    let nextIndex = -1;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);

    if (isShuffled) {
      if (queue.length > 1) {
        do {
          nextIndex = Math.floor(Math.random() * queue.length);
        } while (nextIndex === currentIndex);
      } else {
        nextIndex = 0;
      }
    } else {
      nextIndex = currentIndex + 1;
    }

    if (nextIndex >= 0 && nextIndex < queue.length) {
      playTrack(queue[nextIndex]);
    } else {
      if (repeatMode === "all" && queue.length > 0) {
        playTrack(queue[0]);
      } else {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        if (audioRef.current) {
           audioRef.current.currentTime = 0;
        }
      }
    }
  }, [currentTrack, queue, repeatMode, isShuffled]);

  handleNextTrackRef.current = handleNextTrack;

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const onEnded = () => handleNextTrackRef.current?.();
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("ended", onEnded);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    audio.volume = volume;

    // RESTORE STATE

    const savedStateStr = localStorage.getItem("mucis_playback_state");
    if (savedStateStr) {
      try {
        const { track, time, playing } = JSON.parse(savedStateStr);
        if (track) {
          setCurrentTrack(track);
          
          const setupAudio = async () => {
            let src: string;
            if (hasUnsafeChars(track.path)) {
              try {
                const bytes = await readFile(track.path);
                const blob = new Blob([bytes]);
                src = URL.createObjectURL(blob);
                currentBlobUrl = src;
              } catch (err) {
                console.error("Failed to restore blob audio", err);
                return;
              }
            } else {
              src = convertFileSrc(track.path);
            }
            audio.src = src;
            audio.currentTime = time || 0;
            setCurrentTime(time || 0);
            
            if (playing) {
              audio.play().catch(e => {
                if (e.name !== 'AbortError') {
                  console.error("Autoplay blocked on restore", e);
                }
              });
            }
          };
          setupAudio();
        }
      } catch (e) {
        console.error("Failed to restore playback state", e);
      }
    }

    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.pause();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Save queue separately to avoid stringifying large arrays frequently
  useEffect(() => {
    localStorage.setItem("mucis_queue", JSON.stringify(queue));
  }, [queue]);

  // Cleanup deleted tracks
  useEffect(() => {
    if (!isInitialized) return;

    if (currentTrack) {
      const stillExists = tracks.some(t => t.id === currentTrack.id);
      if (!stillExists) {
        setIsPlaying(false);
        setCurrentTrack(null);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }
    }

    if (queue.length > 0) {
      const newQueue = queue.filter(qTrack => tracks.some(t => t.id === qTrack.id));
      if (newQueue.length !== queue.length) {
        setQueue(newQueue);
      }
    }
  }, [isInitialized, tracks, currentTrack, queue]);

  // Periodic save of playback position
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentTrack && audioRef.current) {
        const stateToSave = {
          track: currentTrack,
          time: audioRef.current.currentTime,
          playing: isPlaying
        };
        localStorage.setItem("mucis_playback_state", JSON.stringify(stateToSave));
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [currentTrack, isPlaying]);

  // Save on unload to guarantee latest position
  useEffect(() => {
    const handleUnload = () => {
      if (currentTrack && audioRef.current) {
        const stateToSave = {
          track: currentTrack,
          time: audioRef.current.currentTime,
          playing: isPlaying
        };
        localStorage.setItem("mucis_playback_state", JSON.stringify(stateToSave));
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [currentTrack, isPlaying]);

  const updateProgress = useCallback(() => {
    if (audioRef.current) {
      const curTime = audioRef.current.currentTime;
      const dur = audioRef.current.duration || 1;
      const prog = curTime / dur;
      
      setCurrentTime(curTime);
      setProgress(prog);

      // Play count is now incremented immediately upon playing the track
    }
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updateProgress);
    }
  }, [isPlaying, currentTrack, incrementPlayCount]);

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updateProgress);
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, updateProgress]);

  // Update tray text when track changes
  useEffect(() => {
    if (currentTrack) {
      const text = `${currentTrack.title} - ${currentTrack.artist || "Unknown Artist"}`;
      invoke("update_tray_text", { text }).catch(e => console.error(e));
    } else {
      invoke("update_tray_text", { text: "Mucis" }).catch(e => console.error(e));
    }
  }, [currentTrack]);

  // Listen to tray events
  useEffect(() => {
    let unlistenPlayPause: () => void;
    let unlistenNext: () => void;
    let unlistenPrev: () => void;

    const setupListeners = async () => {
      unlistenPlayPause = await listen("tray_play_pause", () => {
        togglePlayPauseRef.current?.();
      });
      unlistenNext = await listen("tray_next", () => {
        handleNextTrackRef.current?.();
      });
      unlistenPrev = await listen("tray_prev", () => {
        handlePrevTrackRef.current?.();
      });
    };

    setupListeners();

    return () => {
      if (unlistenPlayPause) unlistenPlayPause();
      if (unlistenNext) unlistenNext();
      if (unlistenPrev) unlistenPrev();
    };
  }, []);

  const playTrack = async (track: Track, newQueue?: Track[]) => {
    if (newQueue) setQueue(newQueue);
    setCurrentTrack(track);
    hasIncrementedRef.current = false; // Reset increment flag for new track

    if (audioRef.current) {
      // Revoke previous blob URL to free memory
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
        currentBlobUrl = null;
      }

      let src: string;

      if (hasUnsafeChars(track.path)) {
        // Filenames with # or ? break the Tauri asset protocol (WebView2 treats
        // %23 as a fragment separator after decoding). Read the file directly
        // via the FS plugin and play it through a Blob URL instead.
        try {
          const bytes = await readFile(track.path);
          const blob = new Blob([bytes]); // let the browser sniff the content type
          src = URL.createObjectURL(blob);
          currentBlobUrl = src;
        } catch (err: any) {
          console.error("Failed to read audio file:", err);
          showNotification(`Failed to read file: ${err.message || 'Unknown error'}`, "error");
          return;
        }
      } else {
        src = convertFileSrc(track.path);
      }

      audioRef.current.src = src;
      audioRef.current.load();
      try {
        await audioRef.current.play();
        
        // Instantly increment play count on successful start
        incrementPlayCount(track.path);
      } catch (err: any) {
        console.error("Playback failed:", err);
        showNotification(`Playback failed: ${err.message || 'Unknown error'}`, "error");
      }
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Play error:", e));
    }
  };

  const prevTrack = () => {
    if (!currentTrack || queue.length === 0) return;
    if (currentTime > 3) {
      seek(0);
      return;
    }
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      playTrack(queue[currentIndex - 1]);
    }
  };

  const handlePrevTrackRef = useRef<() => void>();
  handlePrevTrackRef.current = prevTrack;

  const togglePlayPauseRef = useRef<() => void>();
  togglePlayPauseRef.current = togglePlayPause;

  const setVolume = (vol: number) => {
    const safeVol = Math.max(0, Math.min(1, vol));
    setVolumeState(safeVol);
    localStorage.setItem("mucis_volume", safeVol.toString());
    if (audioRef.current) {
      audioRef.current.volume = safeVol;
    }
  };

  const seek = (newProgress: number) => {
    if (!audioRef.current) return;
    const time = newProgress * duration;
    audioRef.current.currentTime = time;
    setProgress(newProgress);
    setCurrentTime(time);
  };

  return (
    <AudioContext.Provider value={{
      currentTrack, queue, isPlaying, volume, progress, currentTime, duration,
      repeatMode, isShuffled,
      playTrack, togglePlayPause, nextTrack: handleNextTrack, prevTrack, setVolume, seek,
      toggleRepeat: () => setRepeatMode(prev => prev === "off" ? "all" : prev === "all" ? "one" : "off"),
      toggleShuffle: () => setIsShuffled(prev => !prev)
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
