import { useRef, useEffect } from "react";
import { useAudio } from "../../contexts/AudioContext";
import { useTranslation } from "../../i18n";
import { X, Trash2, GripVertical, Play, AudioLines } from "lucide-react";
import { Reorder } from "framer-motion";
import { TrackCover } from "../Cards/TrackCover";

export function PlayingQueue() {
  const { isQueueOpen, setIsQueueOpen, queue, currentTrack, removeFromQueue, clearQueue, setQueue, playTrack, isPlaying, togglePlayPause } = useAudio();
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // Prevent closing if we clicked a toggle button in the player bar
        const target = e.target as HTMLElement;
        if (!target.closest('.queue-toggle-btn')) {
          setIsQueueOpen(false);
        }
      }
    };
    if (isQueueOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isQueueOpen, setIsQueueOpen]);

  if (!isQueueOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity" />
      
      {/* Panel */}
      <div 
        ref={panelRef}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-dark/95 backdrop-blur-xl border-l border-white/10 z-[101] shadow-2xl flex flex-col animate-slide-in-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
          <h2 className="text-2xl font-bold text-light">{(t as any).queue?.title || "Playing Queue"}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={clearQueue}
              className="p-2 text-light/50 hover:text-light hover:bg-white/10 rounded-full transition-colors group"
              title={(t as any).queue?.clear || "Clear Queue"}
            >
              <Trash2 className="w-5 h-5 group-hover:text-red-400 transition-colors" />
            </button>
            <button
              onClick={() => setIsQueueOpen(false)}
              className="p-2 text-light/50 hover:text-light hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Queue List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {queue.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-light/40 space-y-4">
              <AudioLines className="w-16 h-16 opacity-20" />
              <p>{(t as any).queue?.empty || "Queue is empty."}</p>
            </div>
          ) : (
            <Reorder.Group axis="y" values={queue} onReorder={setQueue} className="flex flex-col gap-2">
              {queue.map((track, index) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                  <Reorder.Item 
                    key={track.id + "-" + index} 
                    value={track}
                    className={`flex items-center gap-3 p-2 rounded-xl group transition-colors ${isCurrent ? 'bg-white/10' : 'hover:bg-white/5 bg-transparent'}`}
                  >
                    {/* Drag Handle */}
                    <div className="cursor-grab active:cursor-grabbing text-light/20 group-hover:text-light/50 px-1">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    
                    {/* Track Info */}
                    <div className="flex flex-1 min-w-0 items-center gap-3 cursor-pointer" onClick={() => {
                      if (isCurrent) togglePlayPause();
                      else playTrack(track, queue);
                    }}>
                      <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 relative">
                        <TrackCover path={track.path} className="w-full h-full object-cover" />
                        {isCurrent && isPlaying && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                            <AudioLines className="w-5 h-5 text-secondary animate-pulse" />
                          </div>
                        )}
                        {!isCurrent && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Play className="w-4 h-4 fill-current text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col flex-1 min-w-0 justify-center">
                        <span className={`text-sm font-bold truncate ${isCurrent ? 'text-secondary' : 'text-light'}`}>
                          {track.title}
                        </span>
                        <span className="text-xs text-light/50 truncate">
                          {track.artist || t.home.unknownArtist}
                        </span>
                      </div>
                    </div>
                    
                    {/* Remove Action */}
                    <button
                      onClick={() => removeFromQueue(index)}
                      className="p-2 opacity-0 group-hover:opacity-100 text-light/30 hover:text-light hover:bg-white/10 rounded-full transition-all shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>
          )}
        </div>
      </div>
    </>
  );
}
