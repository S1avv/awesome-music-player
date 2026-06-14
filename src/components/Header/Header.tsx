import { useState, useMemo, useRef, useEffect } from "react";
import { Search, Menu, X, Play, Music, Edit3, User } from "lucide-react";
import { WindowControls } from "./WindowControls";
import { useTranslation } from "../../i18n";
import { useLibrary } from "../../contexts/LibraryContext";
import { useAudio } from "../../contexts/AudioContext";
import { useNavigate } from "react-router-dom";

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { t } = useTranslation();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  
  const { tracks } = useLibrary();
  const { playTrack } = useAudio();
  const navigate = useNavigate();

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return tracks.filter(t => 
      t.title.toLowerCase().includes(q) || 
      (t.artist || "").toLowerCase().includes(q) || 
      (t.album || "").toLowerCase().includes(q)
    ).slice(0, 10);
  }, [query, tracks]);

  const handleTrackClick = (track: any) => {
    playTrack(track, searchResults);
    setQuery("");
    setIsMobileSearchOpen(false);
  };

  const handleArtistClick = (artist: string) => {
    navigate(`/artist/${encodeURIComponent(artist)}`);
    setQuery("");
    setIsMobileSearchOpen(false);
  };


  const handleEditClick = (track: any) => {
    navigate(`/track/${encodeURIComponent(track.path)}`);
    setQuery("");
    setIsMobileSearchOpen(false);
  };

  const headerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const SearchDropdown = () => {
    if (!query.trim()) return null;
    return (
      <div 
        className="absolute top-full left-0 right-0 mt-4 bg-dark-alt border border-white/10 rounded-2xl overflow-hidden z-50 max-h-[60vh] overflow-y-auto pointer-events-auto"
        data-tauri-drag-region="false"
      >
        {searchResults.length === 0 ? (
          <div className="p-6 text-center text-light/50">No results found</div>
        ) : (
          <div className="flex flex-col p-2">
            {searchResults.map(track => (
              <div 
                key={track.id}
                onClick={() => handleTrackClick(track)}
                className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl cursor-pointer group transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-dark flex items-center justify-center shrink-0 text-light/50 group-hover:text-secondary group-hover:bg-secondary/10 transition-colors">
                  <Music className="w-5 h-5 group-hover:hidden" />
                  <Play className="w-5 h-5 hidden group-hover:block fill-current" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <span className="text-light font-bold truncate">{track.title}</span>
                  <div className="flex items-center gap-2 text-sm text-light/50 truncate">
                    <span>{track.artist || t.home.unknownArtist}</span>
                    <span>•</span>
                    <span className="truncate">{track.album || t.playlistDetail.unknownAlbum}</span>
                  </div>
                </div>
                
                <div className="flex items-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0 bg-dark-alt/80 backdrop-blur-sm rounded-full px-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(track);
                    }}
                    className="p-2 hover:bg-white/10 rounded-full transition-all text-light/70 hover:text-light cursor-pointer"
                    title={t.trackDetail?.editTrack || "Edit Track"}
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (track.artist) handleArtistClick(track.artist);
                    }}
                    className="p-2 hover:bg-white/10 rounded-full transition-all text-light/70 hover:text-light cursor-pointer"
                    title={t.artists?.artistLabel || "Go to Artist"}
                  >
                    <User className="w-5 h-5" />
                  </button>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full flex items-center justify-between relative" ref={headerRef}>

      {/* Mobile Header (Hidden on md+) */}
      <div className="flex md:hidden items-center flex-1 gap-2 pointer-events-none w-full">
        {!isMobileSearchOpen ? (
          <>
            <button
              onClick={onMenuClick}
              data-tauri-drag-region="false"
              className="p-2 -ml-2 text-light cursor-pointer hover:bg-white/10 rounded-full transition-colors pointer-events-auto shrink-0"
            >
              <Menu className="w-8 h-8 pointer-events-none" />
            </button>
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              data-tauri-drag-region="false"
              className="p-2 text-light cursor-pointer hover:bg-white/10 rounded-full transition-colors pointer-events-auto shrink-0"
            >
              <Search className="w-7 h-7 pointer-events-none" />
            </button>
          </>
        ) : (
          <div className="flex-1 flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 pointer-events-auto animate-fade-in w-full relative">
            <button 
              onClick={() => { setIsMobileSearchOpen(false); setQuery(""); }} 
              className="cursor-pointer hover:opacity-100 opacity-50 transition-opacity p-1 -ml-1 shrink-0"
            >
              <X className="w-5 h-5 text-light" />
            </button>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t.header.searchPlaceholder}
              className="bg-transparent border-none outline-none text-light w-full placeholder:text-light placeholder:opacity-40 font-sans text-base"
              onPointerDown={(e) => e.stopPropagation()}
            />
            <SearchDropdown />
          </div>
        )}
      </div>

      {/* Desktop Header (Hidden on mobile) */}
      <div className="hidden md:flex items-center justify-between flex-1 pointer-events-none">
        <div className="w-[4.5rem] flex justify-center shrink-0 pointer-events-auto">
          <img src="/image.png?v=2" alt="Avatar" className="w-[3.25rem] h-[3.25rem] object-contain bg-dark select-none" />
        </div>

        {/* Search */}
        <div className="flex-1 flex items-center gap-4 px-6 py-4 pointer-events-auto relative">
          <Search className="w-6 h-6 text-light opacity-25" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t.header.searchPlaceholder}
            className="bg-transparent border-none outline-none text-light w-full placeholder:text-light placeholder:opacity-25 font-sans text-base cursor-text"
            onPointerDown={(e) => e.stopPropagation()}
          />
          <SearchDropdown />
        </div>
      </div>

      <div className={`pointer-events-auto ml-4 shrink-0 ${isMobileSearchOpen ? 'hidden md:block' : ''}`} onPointerDown={(e) => e.stopPropagation()} data-tauri-drag-region="false">
        <WindowControls />
      </div>

      {/* Mobile Search Overlay Background (Below Header) */}
      {isMobileSearchOpen && (
        <div 
          className="fixed inset-0 top-[80px] z-[40] bg-dark/80 backdrop-blur-md md:hidden pointer-events-auto transition-all animate-fade-in"
          onClick={() => setIsMobileSearchOpen(false)}
        />
      )}
    </div>
  );
}
