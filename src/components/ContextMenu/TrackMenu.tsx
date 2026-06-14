import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Play, ListPlus, ArrowRightToLine, Edit3 } from "lucide-react";
import { useAudio } from "../../contexts/AudioContext";
import { Track } from "../../contexts/LibraryContext";
import { useTranslation } from "../../i18n";
import { useNavigate } from "react-router-dom";

export function TrackMenu({ track, playlistTracks }: { track: Track, playlistTracks?: Track[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { playTrack, playNext, addToQueue, currentTrack, togglePlayPause } = useAudio();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && !buttonRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen]);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentTrack?.id === track.id) {
      togglePlayPause();
    } else {
      playTrack(track, playlistTracks || [track]);
    }
    setIsOpen(false);
  };

  const handlePlayNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    playNext(track);
    setIsOpen(false);
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(track);
    setIsOpen(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/track/${encodeURIComponent(track.path)}`);
    setIsOpen(false);
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 text-light/50 hover:text-light hover:bg-white/10 rounded transition-all opacity-0 group-hover:opacity-100"
        title="More Options"
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>

      {isOpen && (
        <div 
          ref={menuRef}
          className="absolute right-0 top-full mt-1 w-48 bg-dark-alt/95 backdrop-blur-xl border border-white/10 rounded-xl py-1 z-[100] shadow-xl animate-fade-in"
        >
          <button onClick={handlePlay} className="w-full text-left px-4 py-2.5 text-sm text-light/80 hover:text-light hover:bg-white/10 flex items-center gap-3 transition-colors">
            <Play className="w-4 h-4" />
            Play
          </button>
          <button onClick={handlePlayNext} className="w-full text-left px-4 py-2.5 text-sm text-light/80 hover:text-light hover:bg-white/10 flex items-center gap-3 transition-colors">
            <ArrowRightToLine className="w-4 h-4" />
            {(t as any).queue?.playNext || "Play Next"}
          </button>
          <button onClick={handleAddToQueue} className="w-full text-left px-4 py-2.5 text-sm text-light/80 hover:text-light hover:bg-white/10 flex items-center gap-3 transition-colors border-b border-white/5">
            <ListPlus className="w-4 h-4" />
            {(t as any).queue?.add || "Add to Queue"}
          </button>
          <button onClick={handleEdit} className="w-full text-left px-4 py-2.5 text-sm text-light/80 hover:text-light hover:bg-white/10 flex items-center gap-3 transition-colors mt-1">
            <Edit3 className="w-4 h-4" />
            {(t as any).trackDetail?.editTrack || "Edit Track"}
          </button>
        </div>
      )}
    </div>
  );
}
