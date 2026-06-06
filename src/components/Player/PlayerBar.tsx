import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX, MoreHorizontal } from "lucide-react";
import { useAudio } from "../../contexts/AudioContext";
import { useState } from "react";
import { Link } from "react-router-dom";
import { TrackCover } from "../Cards/TrackCover";
import { useTranslation } from "../../i18n";
import { formatTime } from "../../utils/formatTime";

export function PlayerBar() {
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
    toggleShuffle
  } = useAudio();

  const { t } = useTranslation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <div 
        onClick={() => setIsCollapsed(false)}
        className="w-full h-2 bg-secondary cursor-pointer hover:h-3 hover:brightness-110 transition-all shrink-0 z-50 shadow-[0_0_15px_currentColor]"
        title="Expand player"
      />
    );
  }

  return (
    <div className="w-full bg-white/5 backdrop-blur-3xl flex flex-col items-center relative shrink-0 z-50 group/player transition-all duration-300">
      
      {/* Collapse Toggle Layer */}
      <div 
        onClick={() => setIsCollapsed(true)}
        className="w-full h-1.5 bg-white/10 cursor-pointer hover:bg-secondary/80 transition-colors"
        title="Collapse player"
      />

      <div className="w-full max-w-[1600px] flex flex-col pb-4 pt-2 px-4 md:px-12">
        {/* Main Player Row */}
        <div className="w-full h-16 md:h-24 flex items-center justify-between gap-4">
        
        {/* Left: Track Info */}
        <div className="flex items-center gap-3 md:gap-4 flex-1 md:w-1/3 min-w-0">
          <Link to={currentTrack ? `/track/${encodeURIComponent(currentTrack.path)}` : "#"} className="w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden shrink-0 hover:scale-105 transition-transform block">
            <TrackCover path={currentTrack?.path} />
          </Link>
          <div className="flex flex-col justify-center overflow-hidden min-w-0">
            <Link to={currentTrack ? `/track/${encodeURIComponent(currentTrack.path)}` : "#"} className="text-light font-bold text-sm md:text-base truncate hover:text-secondary transition-colors inline-block">
              {currentTrack?.title || "No track playing"}
            </Link>
            <span className="text-light/50 text-xs md:text-sm font-medium truncate">
              {currentTrack?.artist || "Unknown Artist"}
            </span>
          </div>
        </div>

        {/* Center: Controls */}
        <div className="flex items-center justify-end md:justify-center gap-4 md:gap-8 shrink-0 md:w-1/3">
          <button 
            onClick={toggleShuffle} 
            className={`group relative hidden md:block transition-colors ${isShuffled ? 'text-secondary drop-shadow-[0_0_8px_currentColor]' : 'text-light/50 hover:text-light'}`}
          >
            <Shuffle className="w-4 h-4 md:w-5 md:h-5" />
            <div className="absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 px-4 py-2 bg-dark-alt border border-white/5 text-light text-sm font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-0 delay-0 group-hover:duration-300 group-hover:delay-[100ms] whitespace-nowrap z-50 pointer-events-none">
              Shuffle
            </div>
          </button>
          
          <button onClick={prevTrack} className="group relative text-light/80 hover:text-light transition-colors">
            <SkipBack className="w-5 h-5 md:w-6 md:h-6 fill-current" />
            <div className="absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 px-4 py-2 bg-dark-alt border border-white/5 text-light text-sm font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-0 delay-0 group-hover:duration-300 group-hover:delay-[100ms] whitespace-nowrap z-50 pointer-events-none">
              {t.tray.prevTrack}
            </div>
          </button>
          
          <button 
            onClick={togglePlayPause}
            className="group relative w-10 h-10 md:w-14 md:h-14 rounded-full bg-secondary flex items-center justify-center text-dark hover:scale-105 transition-transform shrink-0"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 md:w-6 md:h-6 fill-current" />
            ) : (
              <Play className="w-4 h-4 md:w-6 md:h-6 fill-current ml-1" />
            )}
            <div className="absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 px-4 py-2 bg-dark-alt border border-white/5 text-light text-sm font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-0 delay-0 group-hover:duration-300 group-hover:delay-[100ms] whitespace-nowrap z-50 pointer-events-none">
              {t.tray.playPause}
            </div>
          </button>
          
          <button onClick={nextTrack} className="group relative text-light/80 hover:text-light transition-colors">
            <SkipForward className="w-5 h-5 md:w-6 md:h-6 fill-current" />
            <div className="absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 px-4 py-2 bg-dark-alt border border-white/5 text-light text-sm font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-0 delay-0 group-hover:duration-300 group-hover:delay-[100ms] whitespace-nowrap z-50 pointer-events-none">
              {t.tray.nextTrack}
            </div>
          </button>
          
          <button 
            onClick={toggleRepeat} 
            className={`group relative hidden md:block transition-colors ${repeatMode !== 'off' ? 'text-secondary drop-shadow-[0_0_8px_currentColor]' : 'text-light/50 hover:text-light'}`}
          >
            <Repeat className="w-4 h-4 md:w-5 md:h-5" />
            {repeatMode === 'one' && (
              <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-dark text-secondary rounded-full w-3 h-3 flex items-center justify-center">1</span>
            )}
            <div className="absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2 px-4 py-2 bg-dark-alt border border-white/5 text-light text-sm font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-0 delay-0 group-hover:duration-300 group-hover:delay-[100ms] whitespace-nowrap z-50 pointer-events-none">
              {repeatMode === 'one' ? 'Repeat 1' : 'Repeat'}
            </div>
          </button>

          {/* Mobile Options Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="md:hidden text-light/80 hover:text-light transition-colors ml-2"
          >
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>

        {/* Right: Volume (Desktop) */}
        <div className="hidden md:flex items-center justify-end gap-4 w-1/3">
          <button onClick={() => setVolume(volume === 0 ? 1 : 0)} className="text-light/80 hover:text-light transition-colors">
            {volume === 0 ? <VolumeX className="w-4 h-4 md:w-5 md:h-5" /> : <Volume2 className="w-4 h-4 md:w-5 md:h-5" />}
          </button>
          <div className="w-24 md:w-32 h-1 bg-white/10 rounded-full relative group">
            <div 
              className="absolute top-0 left-0 h-full bg-secondary rounded-full pointer-events-none" 
              style={{ width: `${volume * 100}%` }}
            />
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

      {/* Bottom Progress Bar */}
      <div className="w-full flex items-center mt-[-8px] relative group px-4 md:px-12 gap-3 md:gap-4">
          <span className="text-[10px] md:text-xs font-bold text-light/40 w-8 md:w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
          <div className="flex-1 h-1 md:h-1.5 bg-white/10 rounded-full relative hover:h-2 transition-all">
            <div 
              className="absolute top-0 left-0 h-full bg-secondary rounded-full pointer-events-none"
              style={{ width: `${progress * 100}%` }}
            >
              {/* Knob */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-light rounded-full border-2 border-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <input 
              type="range" 
              min="0" max="1" step="0.0001" 
              value={progress || 0}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          <span className="text-[10px] md:text-xs font-bold text-light/40 w-8 md:w-10 tabular-nums">{formatTime(duration)}</span>
        </div>

      </div>

      {/* Mobile Options Menu */}
      {isMobileMenuOpen && (
        <div className="absolute bottom-full right-4 mb-4 bg-dark-alt/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col gap-5 animate-fade-in-up md:hidden w-64 z-50">
          <div className="flex items-center justify-between w-full">
            <button onClick={() => setVolume(volume === 0 ? 1 : 0)} className="text-light/80 hover:text-light transition-colors">
              {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <div className="flex-1 ml-4 h-1.5 bg-white/10 rounded-full relative group">
              <div 
                className="absolute top-0 left-0 h-full bg-secondary rounded-full pointer-events-none" 
                style={{ width: `${volume * 100}%` }}
              />
              <input 
                type="range" 
                min="0" max="1" step="0.01" 
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-around pt-4 border-t border-white/10">
            <button 
              onClick={toggleShuffle} 
              className={`transition-colors flex flex-col items-center gap-1 ${isShuffled ? 'text-secondary drop-shadow-[0_0_8px_currentColor]' : 'text-light/50 hover:text-light'}`}
            >
              <Shuffle className="w-5 h-5" />
              <span className="text-[10px] font-bold">Shuffle</span>
            </button>
            <button 
              onClick={toggleRepeat} 
              className={`transition-colors flex flex-col items-center gap-1 relative ${repeatMode !== 'off' ? 'text-secondary drop-shadow-[0_0_8px_currentColor]' : 'text-light/50 hover:text-light'}`}
            >
              <Repeat className="w-5 h-5" />
              <span className="text-[10px] font-bold">{repeatMode === 'one' ? 'Repeat 1' : 'Repeat'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
