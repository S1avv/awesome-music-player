import { useEffect, useCallback, MutableRefObject } from "react";
import { Track } from "../../contexts/LibraryContext";

interface UseAudioProgressProps {
  audioRef: MutableRefObject<HTMLAudioElement | null>;
  rafRef: MutableRefObject<number | null>;
  isPlaying: boolean;
  currentTrack: Track | null;
  setCurrentTime: (time: number) => void;
  setProgress: (progress: number) => void;
}

export function useAudioProgress({
  audioRef,
  rafRef,
  isPlaying,
  currentTrack,
  setCurrentTime,
  setProgress,
}: UseAudioProgressProps) {
  const updateProgress = useCallback(() => {
    if (audioRef.current) {
      const curTime = audioRef.current.currentTime;
      const dur = audioRef.current.duration || 1;
      const prog = curTime / dur;
      
      setCurrentTime(curTime);
      setProgress(prog);
    }
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updateProgress);
    }
  }, [isPlaying, currentTrack, setCurrentTime, setProgress, audioRef, rafRef]);

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updateProgress);
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, updateProgress, rafRef]);

  return { updateProgress };
}
