import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";

import { useTranslation } from "../../i18n";
import { useLibrary, Track } from "../../contexts/LibraryContext";
import { useAudio } from "../../contexts/AudioContext";
import { Plus, X, Play, Pause, Grid, List, Clock, ChevronDown, ChevronUp, AudioLines } from "lucide-react";
import { MediaCard } from "../../components/Cards/MediaCard";
import { PlaylistCover } from "../../components/Cards/PlaylistCover";
import { formatTime } from "../../utils/formatTime";
import { TrackMenu } from "../../components/ContextMenu/TrackMenu";

export function Playlist() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { playlists, tracks, createPlaylist } = useLibrary();
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = useAudio();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"recently_added" | "my_collection" | "most_played">(
    (location.state as any)?.tab || "recently_added"
  );
  
  const [sortConfig, setSortConfig] = useState<{key: keyof Track, direction: 'asc'|'desc'} | null>(null);

  useEffect(() => {
    setSortConfig(null);
  }, [activeTab]);

  const handleSort = (key: keyof Track) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof Track }) => {
    if (sortConfig?.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 inline" /> : <ChevronDown className="w-3 h-3 ml-1 inline" />;
  };

  useEffect(() => {
    if ((location.state as any)?.tab) {
      setActiveTab((location.state as any).tab);
    }
  }, [location.state]);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const tabOptions = [
    { id: "recently_added", label: t.playlist?.recentlyAdded || "Recently Added" },
    { id: "my_collection", label: t.playlist?.myCollection || "Playlists" },
    { id: "most_played", label: t.playlist?.mostPlayed || "Most Played Tracks" },
  ] as const;
  
  const currentTabLabel = tabOptions.find(opt => opt.id === activeTab)?.label || tabOptions[0].label;

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    setIsCreating(true);
    try {
      await createPlaylist(newPlaylistName.trim());
      setIsCreateModalOpen(false);
      setNewPlaylistName("");
    } catch (error) {
      console.error("Failed to create playlist:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 pb-12 animate-fade-in">
      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-dark/95 backdrop-blur-xl pt-2 pb-4 -mx-6 px-6 md:mx-0 md:px-0 flex items-center gap-4 border-b border-transparent">
        {/* Mobile Dropdown (shown only on small screens) */}
        <div className="relative md:hidden min-w-[200px]" ref={dropdownRef}>
          <div 
            className="w-full bg-dark-alt text-light px-6 py-3 rounded-full font-bold flex items-center justify-between cursor-pointer border border-white/10 hover:border-white/20 transition-all"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span>{currentTabLabel}</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
          
          {isDropdownOpen && (
            <div className="absolute top-[110%] left-0 w-full bg-dark border border-white/10 rounded-xl overflow-hidden z-50 py-2">
              {tabOptions.map(opt => (
                <div 
                  key={opt.id}
                  className={`px-6 py-3 cursor-pointer hover:bg-white/5 transition-colors font-medium ${opt.id === activeTab ? 'text-secondary bg-white/5' : 'text-light'}`}
                  onClick={() => {
                    setActiveTab(opt.id as any);
                    setIsDropdownOpen(false);
                  }}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Buttons (shown only on medium screens and larger) */}
        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={() => setActiveTab("recently_added")}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              activeTab === "recently_added" 
                ? "bg-secondary text-dark" 
                : "bg-transparent text-light/70 border border-white/20 hover:border-white/40"
            }`}
          >
            {t.playlist?.recentlyAdded || "Recently Added"}
          </button>
          <button 
            onClick={() => setActiveTab("my_collection")}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              activeTab === "my_collection" 
                ? "bg-secondary text-dark" 
                : "bg-transparent text-light/70 border border-white/20 hover:border-white/40"
            }`}
          >
            {t.playlist?.myCollection || "Playlists"}
          </button>
          <button 
            onClick={() => setActiveTab("most_played")}
            className={`px-6 py-2 rounded-full font-semibold transition-colors ${
              activeTab === "most_played" 
                ? "bg-secondary text-dark" 
                : "bg-transparent text-light/70 border border-white/20 hover:border-white/40"
            }`}
          >
            {t.playlist?.mostPlayed || "Most Played Tracks"}
          </button>
        </div>
        
        {/* View Mode Toggles for Tracks Tabs */}
        {activeTab !== "my_collection" && (
          <div className="ml-auto flex items-center gap-2 bg-dark-alt p-1 rounded-full border border-white/5">
            <button 
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-full transition-colors ${viewMode === "table" ? "bg-white/10 text-secondary" : "text-light/50 hover:text-light"}`}
            >
              <List className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-full transition-colors ${viewMode === "grid" ? "bg-white/10 text-secondary" : "text-light/50 hover:text-light"}`}
            >
              <Grid className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {(() => {
        let playlistTracks = tracks;
        if (activeTab === "recently_added") {
          playlistTracks = [...tracks].sort((a, b) => b.added_at - a.added_at);
        } else if (activeTab === "most_played") {
          playlistTracks = [...tracks].filter(t => t.play_count > 0).sort((a, b) => b.play_count - a.play_count);
        }

        if (sortConfig !== null) {
          playlistTracks = [...playlistTracks].sort((a, b) => {
            const aVal = a[sortConfig.key] ?? '';
            const bVal = b[sortConfig.key] ?? '';
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
          });
        }

        return (
          <>
            {/* Grid for Collections */}
            {activeTab === "my_collection" && tracks.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6">
          {/* Create Playlist Button */}
          <div 
            onClick={() => setIsCreateModalOpen(true)}
            className="relative aspect-square rounded-[2rem] overflow-hidden group cursor-pointer bg-dark border-2 border-dashed border-white/10 hover:border-secondary/50 hover:bg-white/5 transition-all flex flex-col items-center justify-center min-w-0 p-4"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 group-hover:bg-secondary/10 rounded-full flex items-center justify-center mb-2 md:mb-4 transition-colors shrink-0">
              <Plus className="w-6 h-6 md:w-8 md:h-8 text-light/50 group-hover:text-secondary transition-colors" />
            </div>
            <h3 className="text-light text-base md:text-lg font-bold text-center">{t.playlist.createPlaylist}</h3>
          </div>

          {playlists.filter(p => p.id !== 'main_library').map(playlist => (
            <div 
              key={playlist.id} 
              onClick={() => navigate(`/playlist/${encodeURIComponent(playlist.id)}`)}
              className="relative aspect-square rounded-[2rem] overflow-hidden group cursor-pointer transition-all min-w-0"
            >
              {/* Background */}
              <PlaylistCover 
                playlist={playlist}
                allTracks={tracks}
                className="absolute inset-0 transition-transform duration-700 group-hover:scale-110 bg-dark"
                fallbackImage="/PhonographRecord.png"
              />
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/20 to-transparent" />
              
              {/* Content */}
              <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col justify-end">
                <h3 className="text-light text-2xl font-bold truncate mb-1">
                  {playlist.name}
                </h3>
                <p className="text-light/50 text-sm font-medium">
                  {playlist.tracks.length} {t.playlist.tracks}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tracks View for Recently Added & Most Played */}
      {activeTab !== "my_collection" && playlistTracks.length > 0 && (
        <div className="w-full">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6">
              {playlistTracks.map((track) => (
                <div key={track.id} className="min-w-0">
                  <MediaCard 
                    title={track.title}
                    subtitle={track.artist || t.home.unknownArtist}
                    trackPath={track.path}
                    titleHref={`/track/${encodeURIComponent(track.path)}`}
                    isCurrentTrack={currentTrack?.id === track.id}
                    isPlaying={isPlaying}
                    playCount={activeTab === 'most_played' ? track.play_count : undefined}
                    track={track}
                    playlistTracks={playlistTracks}
                    onPlayPauseClick={(e) => {
                      e.stopPropagation();
                      if (currentTrack?.id === track.id) {
                        togglePlayPause();
                      } else {
                        playTrack(track, playlistTracks);
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col w-full">
              {/* Table Header */}
              <div className={`grid ${activeTab === 'most_played' ? 'grid-cols-[2.5rem_1fr_3.75rem_4rem_3rem] md:grid-cols-[2.5rem_1fr_1fr_3.75rem_4rem_3rem] lg:grid-cols-[2.5rem_1fr_1fr_1fr_3.75rem_4rem_3rem]' : 'grid-cols-[2.5rem_1fr_3.75rem_3rem] md:grid-cols-[2.5rem_1fr_1fr_3.75rem_3rem] lg:grid-cols-[2.5rem_1fr_1fr_1fr_3.75rem_3rem]'} gap-4 px-6 py-4 border-b border-white/5 text-light/50 text-sm font-semibold uppercase tracking-wider mb-2 sticky top-[72px] md:top-[64px] z-20 bg-dark/95 backdrop-blur-xl -mx-6 md:mx-0`}>
                <div>#</div>
                <button onClick={() => handleSort('title')} className="text-left flex items-center hover:text-light transition-colors">{(t as any).playlistDetail?.track || "TITLE"}<SortIcon columnKey="title" /></button>
                <button onClick={() => handleSort('artist')} className="hidden md:flex items-center text-left hover:text-light transition-colors">{(t as any).playlistDetail?.artist || "ARTIST"}<SortIcon columnKey="artist" /></button>
                <button onClick={() => handleSort('album')} className="hidden lg:flex items-center text-left hover:text-light transition-colors">{(t as any).playlistDetail?.album || "ALBUM"}<SortIcon columnKey="album" /></button>
                <button onClick={() => handleSort('duration')} className="flex justify-end items-center hover:text-light transition-colors ml-auto"><Clock className="w-4 h-4 mr-1" /><SortIcon columnKey="duration" /></button>
                {activeTab === 'most_played' && <button onClick={() => handleSort('play_count')} className="text-right flex justify-end items-center hover:text-light transition-colors ml-auto">{t.playlistDetail.plays}<SortIcon columnKey="play_count" /></button>}
                <div></div>
              </div>

              {/* Table Rows */}
              {playlistTracks.map((track, index) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                <div 
                  key={track.id}
                  onClick={() => {
                    if (isCurrent) togglePlayPause();
                    else playTrack(track, playlistTracks);
                  }}
                  className={`grid ${activeTab === 'most_played' ? 'grid-cols-[2.5rem_1fr_3.75rem_4rem_3rem] md:grid-cols-[2.5rem_1fr_1fr_3.75rem_4rem_3rem] lg:grid-cols-[2.5rem_1fr_1fr_1fr_3.75rem_4rem_3rem]' : 'grid-cols-[2.5rem_1fr_3.75rem_3rem] md:grid-cols-[2.5rem_1fr_1fr_3.75rem_3rem] lg:grid-cols-[2.5rem_1fr_1fr_1fr_3.75rem_3rem]'} gap-4 px-6 py-4 items-center rounded-xl transition-colors group cursor-pointer ${isCurrent ? 'bg-white/10' : 'hover:bg-white/5'}`}
                >
                  <div className={`font-medium group-hover:hidden ${isCurrent ? 'text-secondary' : 'text-light/50'}`}>
                    {isCurrent && isPlaying ? <AudioLines className="w-4 h-4 text-secondary animate-pulse" /> : index + 1}
                  </div>
                  <div className="hidden group-hover:flex items-center text-secondary">
                    {isCurrent && isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                  </div>
                  
                  <div className="font-bold text-light truncate flex items-center gap-2">
                    <span>{track.title}</span>
                  </div>
                  <div className="hidden md:block text-light/70 truncate">
                    {track.artist || t.home.unknownArtist}
                  </div>
                  <div className="hidden lg:block text-light/50 truncate">
                    {track.album || t.playlistDetail.unknownAlbum}
                  </div>
                  <div className="text-light/50 text-right text-sm">
                    {track.duration ? formatTime(track.duration) : '--:--'}
                  </div>
                  {activeTab === 'most_played' && (
                    <div className="text-light/50 text-right font-medium">
                      {track.play_count || 0}
                    </div>
                  )}
                  <div className="flex items-center justify-end">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <TrackMenu track={track} playlistTracks={playlistTracks} />
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty State for Collections */}
      {activeTab === "my_collection" && playlists.length <= 1 && (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
          <h2 className="text-2xl font-bold text-light mb-3">{t.playlist?.noCollectionsTitle || "No playlists found"}</h2>
          <p className="text-light/50 max-w-md">
            {t.playlist?.noCollectionsDesc || "Create your first playlist and start organizing your favorite tracks."}
          </p>
        </div>
      )}

      {/* Empty State for Tracks */}
      {activeTab !== "my_collection" && playlistTracks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
          <h2 className="text-2xl font-bold text-light mb-3">
            {activeTab === "recently_added" 
              ? (t.playlist?.noRecentlyAddedTitle || "No tracks recently added")
              : (t.playlist?.noMostPlayedTitle || "No tracks played yet")}
          </h2>
          <p className="text-light/50 max-w-md">
            {activeTab === "recently_added"
              ? (t.playlist?.noRecentlyAddedDesc || "Newly added tracks will appear here.")
              : (t.playlist?.noMostPlayedDesc || "Listen to some music and your most played tracks will appear here.")}
          </p>
        </div>
      )}

      {/* Create Playlist Modal */}
      {isCreateModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCreateModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-dark-alt w-full max-w-md rounded-3xl p-8 border border-white/10">
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-6 right-6 text-light/50 hover:text-light transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-light mb-2">{t.playlist.createPlaylist}</h2>
            <p className="text-light/50 mb-6">{t.playlist.createDesc}</p>
            
            <form onSubmit={handleCreatePlaylist}>
              <input
                autoFocus
                type="text"
                placeholder={t.playlist.createPlaceholder}
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full bg-dark text-light placeholder-light/30 rounded-xl px-4 py-4 mb-6 border border-white/10 focus:border-secondary focus:outline-none transition-colors"
              />
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-light bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newPlaylistName.trim()}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-dark bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreating ? t.common.creating : t.common.create}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
          </>
        );
      })()}
    </div>
  );
}
