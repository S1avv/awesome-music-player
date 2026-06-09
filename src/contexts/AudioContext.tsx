import { createContext, useContext, ReactNode, useRef } from "react";
import { Track, useLibrary } from "./LibraryContext";
import { useNotification } from "./NotificationContext";
import { useAudioState } from "../hooks/audio/useAudioState";
import { useAudioPlayback } from "../hooks/audio/useAudioPlayback";
import { useAudioProgress } from "../hooks/audio/useAudioProgress";
import { useAudioLifecycle } from "../hooks/audio/useAudioLifecycle";
import { useAudioShortcuts } from "../hooks/audio/useAudioShortcuts";

interface AudioContextType {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  volume: number;
  progress: number;
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
  isNowPlayingOpen: boolean;
  setIsNowPlayingOpen: (open: boolean) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const state = useAudioState();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  
  const { incrementPlayCount, tracks, isInitialized } = useLibrary();
  const { showNotification } = useNotification();

  const handleNextTrackRef = useRef<(() => void) | null>(null);
  const handlePrevTrackRef = useRef<(() => void) | null>(null);
  const togglePlayPauseRef = useRef<(() => void) | null>(null);

  useAudioProgress({
    audioRef, rafRef, isPlaying: state.isPlaying, currentTrack: state.currentTrack,
    setCurrentTime: state.setCurrentTime, setProgress: state.setProgress
  });

  const playback = useAudioPlayback({
    ...state, audioRef, incrementPlayCount, showNotification
  });

  handleNextTrackRef.current = playback.handleNextTrack;
  handlePrevTrackRef.current = playback.prevTrack;
  togglePlayPauseRef.current = playback.togglePlayPause;

  useAudioLifecycle({
    ...state, audioRef, rafRef, isInitialized, tracks, handleNextTrackRef
  });

  useAudioShortcuts({
    currentTrack: state.currentTrack,
    togglePlayPauseRef, handleNextTrackRef, handlePrevTrackRef
  });

  return (
    <AudioContext.Provider value={{
      ...state,
      playTrack: playback.playTrack,
      togglePlayPause: playback.togglePlayPause,
      nextTrack: playback.handleNextTrack,
      prevTrack: playback.prevTrack,
      setVolume: playback.setVolume,
      seek: playback.seek,
      toggleRepeat: () => state.setRepeatMode(prev => prev === "off" ? "all" : prev === "all" ? "one" : "off"),
      toggleShuffle: () => state.setIsShuffled(prev => !prev),
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
