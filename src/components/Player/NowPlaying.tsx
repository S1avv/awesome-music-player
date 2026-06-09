import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX } from "lucide-react";
import { useAudio } from "../../contexts/AudioContext";
import { TrackCover } from "../Cards/TrackCover";
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

function formatTime(seconds: number) {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function NowPlaying() {
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    currentTime,
    duration,
    togglePlayPause,
    nextTrack,
    prevTrack,
    setVolume,
    seek,
    repeatMode,
    isShuffled,
    toggleRepeat,
    toggleShuffle,
    isNowPlayingOpen,
    setIsNowPlayingOpen
  } = useAudio();

  const [coverUrl, setCoverUrl] = useState<string>("/PhonographRecord.png");

  useEffect(() => {
    if (currentTrack?.path) {
      invoke<string>("get_track_cover", { path: currentTrack.path })
        .then(url => {
          if (url) setCoverUrl(url);
          else setCoverUrl("/PhonographRecord.png");
        })
        .catch(() => setCoverUrl("/PhonographRecord.png"));
    } else {
      setCoverUrl("/PhonographRecord.png");
    }
  }, [currentTrack]);

  return (
    <AnimatePresence>
      {isNowPlayingOpen && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[100] flex flex-col bg-dark overflow-hidden"
        >
          {/* Blurred Background */}
          <div className="absolute inset-0 z-0">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 blur-3xl scale-110 transition-all duration-1000"
              style={{ backgroundImage: `url('${coverUrl}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-dark/40 via-dark/60 to-dark" />
          </div>

          {/* Top Bar */}
          <div className="relative z-10 w-full pt-12 pb-6 px-8 flex justify-between items-center" data-tauri-drag-region="true">
            <button
              onClick={() => setIsNowPlayingOpen(false)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors text-light cursor-pointer group"
            >
              <ChevronDown className="w-6 h-6 group-hover:translate-y-0.5 transition-transform" />
            </button>
            <div className="text-light/70 text-sm font-bold tracking-widest uppercase pointer-events-none" data-tauri-drag-region="true">
              Now Playing
            </div>
            <div className="w-12 h-12" /> {/* Spacer to balance flex-between */}
          </div>

          {/* Main Content */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto px-8 lg:flex-row lg:gap-24 pb-6 min-h-0">

            {/* Square Poster */}
            <div className="w-full max-w-[240px] sm:max-w-[320px] lg:max-w-[500px] max-h-[30vh] lg:max-h-[50vh] aspect-square rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-dark-alt mb-6 lg:mb-0 shrink border border-white/10">
              <TrackCover path={currentTrack?.path} className="w-full h-full object-cover" />
            </div>

            {/* Track Info & Controls */}
            <div className="flex flex-col w-full max-w-[400px] lg:max-w-[500px] min-h-0 justify-center">

              {/* Track Info */}
              <div className="flex flex-col items-start mb-4 lg:mb-8 text-left w-full shrink-0">
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black text-light mb-1 lg:mb-2 truncate w-full">
                  {currentTrack?.title || "No track playing"}
                </h1>
                <p className="text-lg lg:text-2xl text-light/60 font-medium truncate w-full">
                  {currentTrack?.artist || "Unknown Artist"}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full flex items-center gap-3 mb-4 lg:mb-8 relative group shrink-0">
                <span className="text-xs lg:text-sm font-bold text-light/40 w-10 lg:w-12 text-right tabular-nums">
                  {formatTime(currentTime)}
                </span>
                <div className="flex-1 h-1.5 lg:h-2 bg-white/20 rounded-full relative hover:h-2 lg:hover:h-3 transition-all">
                  <div
                    className="absolute top-0 left-0 h-full bg-secondary rounded-full pointer-events-none"
                    style={{ width: `${(Number.isFinite(progress) ? progress : 0) * 100}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 lg:w-5 lg:h-5 bg-light rounded-full border-2 border-secondary shadow-[0_0_10px_rgba(0,0,0,0.5)] opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                  <input
                    type="range"
                    min="0" max="1" step="0.0001"
                    value={progress || 0}
                    onChange={(e) => seek(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <span className="text-xs lg:text-sm font-bold text-light/40 w-10 lg:w-12 tabular-nums">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-between w-full mb-4 lg:mb-8 shrink-0">
                <button
                  onClick={toggleShuffle}
                  className={`transition-colors p-2 lg:p-3 rounded-full hover:bg-white/5 ${isShuffled ? 'text-secondary drop-shadow-[0_0_8px_currentColor]' : 'text-light/50 hover:text-light'}`}
                >
                  <Shuffle className="w-5 h-5 lg:w-6 lg:h-6" />
                </button>

                <div className="flex items-center gap-3 sm:gap-6">
                  <button onClick={prevTrack} className="text-light/80 hover:text-light transition-colors p-2 lg:p-3 hover:bg-white/5 rounded-full">
                    <SkipBack className="w-6 h-6 lg:w-8 lg:h-8 fill-current" />
                  </button>

                  <button
                    onClick={togglePlayPause}
                    className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-secondary flex items-center justify-center text-dark hover:scale-105 transition-transform shadow-[0_0_30px_rgba(0,0,0,0.3)] shrink-0"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 lg:w-8 lg:h-8 fill-current" />
                    ) : (
                      <Play className="w-6 h-6 lg:w-8 lg:h-8 fill-current ml-1 lg:ml-2" />
                    )}
                  </button>

                  <button onClick={nextTrack} className="text-light/80 hover:text-light transition-colors p-2 lg:p-3 hover:bg-white/5 rounded-full">
                    <SkipForward className="w-6 h-6 lg:w-8 lg:h-8 fill-current" />
                  </button>
                </div>

                <button
                  onClick={toggleRepeat}
                  className={`transition-colors p-2 lg:p-3 rounded-full hover:bg-white/5 relative ${repeatMode !== 'off' ? 'text-secondary drop-shadow-[0_0_8px_currentColor]' : 'text-light/50 hover:text-light'}`}
                >
                  <Repeat className="w-5 h-5 lg:w-6 lg:h-6" />
                  {repeatMode === 'one' && (
                    <span className="absolute top-1 right-1 lg:top-1 lg:right-1 text-[8px] lg:text-[10px] font-black bg-dark text-secondary rounded-full w-3 h-3 lg:w-4 lg:h-4 flex items-center justify-center shadow-sm">1</span>
                  )}
                </button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-4 w-full max-w-[240px] lg:max-w-[300px] mx-auto opacity-70 hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => setVolume(volume === 0 ? 1 : 0)} className="text-light/80 hover:text-light transition-colors">
                  {volume === 0 ? <VolumeX className="w-4 h-4 lg:w-5 lg:h-5" /> : <Volume2 className="w-4 h-4 lg:w-5 lg:h-5" />}
                </button>
                <div className="flex-1 h-1.5 bg-white/20 rounded-full relative group">
                  <div
                    className="absolute top-0 left-0 h-full bg-secondary rounded-full pointer-events-none"
                    style={{ width: `${(Number.isFinite(volume) ? volume : 0) * 100}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-light rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-125" />
                  </div>
                  <input
                    type="range"
                    min="0" max="1" step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
