import { useCallback, MutableRefObject, useRef } from "react";
import { Track } from "../../contexts/LibraryContext";
import { hasUnsafeChars, revokeCurrentBlobUrl, setCurrentBlobUrl } from "../../utils/audioUtils";
import { readFile } from "@tauri-apps/plugin-fs";
import { convertFileSrc } from "@tauri-apps/api/core";

interface UseAudioPlaybackProps {
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  currentTrack: Track | null;
  setCurrentTrack: (t: Track | null) => void;
  queue: Track[];
  setQueue: (q: Track[]) => void;
  repeatMode: "off" | "all" | "one";
  isShuffled: boolean;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  duration: number;
  setProgress: (p: number) => void;
  setCurrentTime: (t: number) => void;
  setVolumeState: (v: number) => void;
  incrementPlayCount: (path: string) => void;
  showNotification: (msg: string, type: "error" | "success" | "info") => void;
}

export function useAudioPlayback({
  audioRef,
  currentTrack,
  setCurrentTrack,
  queue,
  setQueue,
  repeatMode,
  isShuffled,
  isPlaying,
  setIsPlaying,
  duration,
  setProgress,
  setCurrentTime,
  setVolumeState,
  incrementPlayCount,
  showNotification
}: UseAudioPlaybackProps) {
  const hasIncrementedRef = useRef(false);

  const playTrack = useCallback(async (track: Track, newQueue?: Track[]) => {
    if (newQueue) setQueue(newQueue);
    setCurrentTrack(track);
    hasIncrementedRef.current = false;

    if (audioRef.current) {
      revokeCurrentBlobUrl();

      let src: string;

      if (hasUnsafeChars(track.path)) {
        try {
          const bytes = await readFile(track.path);
          const blob = new Blob([bytes]);
          src = URL.createObjectURL(blob);
          setCurrentBlobUrl(src);
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
        incrementPlayCount(track.path);
      } catch (err: any) {
        console.error("Playback failed:", err);
        showNotification(`Playback failed: ${err.message || 'Unknown error'}`, "error");
      }
    }
  }, [setQueue, setCurrentTrack, showNotification, incrementPlayCount, audioRef]);

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
  }, [currentTrack, queue, repeatMode, isShuffled, playTrack, setProgress, setCurrentTime, setIsPlaying, incrementPlayCount, audioRef]);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Play error:", e));
    }
  }, [isPlaying, currentTrack, audioRef]);

  const seek = useCallback((newProgress: number) => {
    if (!audioRef.current) return;
    const time = newProgress * duration;
    audioRef.current.currentTime = time;
    setProgress(newProgress);
    setCurrentTime(time);
  }, [duration, setProgress, setCurrentTime, audioRef]);

  const prevTrack = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    if (audioRef.current && audioRef.current.currentTime > 3) {
      seek(0);
      return;
    }
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    if (currentIndex > 0) {
      playTrack(queue[currentIndex - 1]);
    }
  }, [currentTrack, queue, seek, playTrack, audioRef]);

  const setVolume = useCallback((vol: number) => {
    const safeVol = Math.max(0, Math.min(1, vol));
    setVolumeState(safeVol);
    localStorage.setItem("mucis_volume", safeVol.toString());
    if (audioRef.current) {
      audioRef.current.volume = safeVol;
    }
  }, [setVolumeState, audioRef]);

  return {
    playTrack,
    handleNextTrack,
    togglePlayPause,
    seek,
    prevTrack,
    setVolume
  };
}
