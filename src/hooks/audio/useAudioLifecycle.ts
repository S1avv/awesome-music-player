import { useEffect, MutableRefObject } from "react";
import { Track } from "../../contexts/LibraryContext";
import { hasUnsafeChars, setCurrentBlobUrl } from "../../utils/audioUtils";
import { readFile } from "@tauri-apps/plugin-fs";
import { convertFileSrc } from "@tauri-apps/api/core";

interface UseAudioLifecycleProps {
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  rafRef: MutableRefObject<number | null>;
  currentTrack: Track | null;
  setCurrentTrack: (t: Track | null) => void;
  queue: Track[];
  setQueue: (q: Track[]) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  volume: number;
  setDuration: (dur: number) => void;
  setCurrentTime: (time: number) => void;
  isInitialized: boolean;
  tracks: Track[];
  handleNextTrackRef: MutableRefObject<(() => void) | null>;
}

export function useAudioLifecycle({
  audioRef,
  rafRef,
  currentTrack,
  setCurrentTrack,
  queue,
  setQueue,
  isPlaying,
  setIsPlaying,
  volume,
  setDuration,
  setCurrentTime,
  isInitialized,
  tracks,
  handleNextTrackRef,
}: UseAudioLifecycleProps) {
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
        const { track, time } = JSON.parse(savedStateStr);
        if (track) {
          setCurrentTrack(track);
          
          const setupAudio = async () => {
            let src: string;
            if (hasUnsafeChars(track.path)) {
              try {
                const bytes = await readFile(track.path);
                const blob = new Blob([bytes]);
                src = URL.createObjectURL(blob);
                setCurrentBlobUrl(src);
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
            
            // Deliberately do not call audio.play() even if playing was true,
            // so the application always opens in a paused state.
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
  }, [isInitialized, tracks, currentTrack, queue, setQueue, setCurrentTrack, setIsPlaying, audioRef]);

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
  }, [currentTrack, isPlaying, audioRef]);

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
  }, [currentTrack, isPlaying, audioRef]);
}
