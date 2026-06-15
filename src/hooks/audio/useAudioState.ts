import { useState } from "react";
import { Track } from "../../contexts/LibraryContext";

export function useAudioState() {
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
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  return {
    currentTrack, setCurrentTrack,
    queue, setQueue,
    isPlaying, setIsPlaying,
    volume, setVolumeState,
    progress, setProgress,
    currentTime, setCurrentTime,
    duration, setDuration,
    repeatMode, setRepeatMode,
    isShuffled, setIsShuffled,
    isNowPlayingOpen, setIsNowPlayingOpen,
    isQueueOpen, setIsQueueOpen
  };
}
