import { useEffect, MutableRefObject } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Track } from "../../contexts/LibraryContext";

interface UseAudioShortcutsProps {
  currentTrack: Track | null;
  togglePlayPauseRef: MutableRefObject<(() => void) | null>;
  handleNextTrackRef: MutableRefObject<(() => void) | null>;
  handlePrevTrackRef: MutableRefObject<(() => void) | null>;
}

export function useAudioShortcuts({
  currentTrack,
  togglePlayPauseRef,
  handleNextTrackRef,
  handlePrevTrackRef
}: UseAudioShortcutsProps) {
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
  }, [togglePlayPauseRef, handleNextTrackRef, handlePrevTrackRef]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPauseRef.current?.();
      } else if (e.code === 'KeyN' && e.shiftKey) {
        handleNextTrackRef.current?.();
      } else if (e.code === 'KeyP' && e.shiftKey) {
        handlePrevTrackRef.current?.();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPauseRef, handleNextTrackRef, handlePrevTrackRef]);
}
