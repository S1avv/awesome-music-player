import { useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { useLibrary } from "../../contexts/LibraryContext";
import { useAudio } from "../../contexts/AudioContext";
import { useTranslation } from "../../i18n";
import { Play, Pause, Grid, List, ArrowLeft, Clock, Pencil, X, Edit3, AudioLines } from "lucide-react";
import { MediaCard } from "../../components/Cards/MediaCard";
import { Link } from "react-router-dom";

function formatTime(seconds: number) {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { collections, tracks, scanLibrary } = useLibrary();
  const { playTrack, currentTrack, isPlaying, togglePlayPause, queue } = useAudio();
  
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  if (!id) return null;
  
  const decodedId = decodeURIComponent(id).replace(/\\/g, '/');

  const collection = collections.find(c => c.id.toLowerCase() === decodedId.toLowerCase());
  let collectionName = collection ? collection.name : t.playlistDetail.playlist;
  let collectionImage = collection ? collection.image : "/PhonographRecord.png";

  if (decodedId === "main_library") collectionName = t.playlist.allTracks;
  if (decodedId === "recently_added") collectionName = t.playlist.recentlyAdded;
  if (decodedId === "most_played") collectionName = t.playlist.mostPlayed;

  let playlistTracks = tracks;
  if (decodedId === "main_library") {
    playlistTracks = tracks;
  } else if (decodedId === "recently_added") {
    playlistTracks = [...tracks].sort((a, b) => b.added_at - a.added_at);
  } else if (decodedId === "most_played") {
    playlistTracks = [...tracks].filter(t => t.play_count > 0).sort((a, b) => b.play_count - a.play_count);
  } else {
    playlistTracks = tracks.filter(t => t.path.replace(/\\/g, '/').includes(decodedId.replace(/\\/g, '/')));
  }

  const isSpecialPlaylist = ["main_library", "recently_added", "most_played"].includes(decodedId);

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || newFolderName.trim() === collectionName) return;

    setIsRenaming(true);
    try {
      const newPath = await invoke<string>("rename_folder", { 
        oldPath: decodedId, 
        newName: newFolderName.trim() 
      });
      await scanLibrary();
      setIsRenameModalOpen(false);
      // Navigate to the new path to prevent the current page from breaking
      navigate(`/playlist/${encodeURIComponent(newPath)}`, { replace: true });
    } catch (error) {
      console.error("Failed to rename playlist:", error);
    } finally {
      setIsRenaming(false);
    }
  };

  const openRenameModal = () => {
    setNewFolderName(collectionName);
    setIsRenameModalOpen(true);
  };

  return (
    <div className="w-full flex flex-col pb-12 animate-fade-in">
      
      {/* Header Banner */}
      <div className="relative w-full h-[19rem] md:h-[22rem] rounded-[3rem] overflow-hidden group mb-8 flex-shrink-0">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
          style={{ backgroundImage: `url('${collectionImage}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/80 to-transparent" />
        
        <div className="flex gap-4 absolute top-8 left-2 md:left-4 lg:left-8 z-20">
          {/* Back Button */}
          <button 
            onClick={() => navigate("/playlist")}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors text-light cursor-pointer"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {/* Edit Button */}
          {!isSpecialPlaylist && (
            <button 
              onClick={openRenameModal}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors text-light cursor-pointer"
              title={t.playlistDetail.renameTitle}
            >
              <Pencil className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="absolute inset-0 p-8 pb-8 flex flex-col justify-end z-10 pointer-events-none">
          <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold tracking-wider text-light mb-4 border border-white/5 uppercase w-fit">
            {t.playlistDetail.playlist}
          </span>
          <h1 className="text-5xl md:text-6xl font-black text-light mb-2 leading-tight truncate">
            {collectionName}
          </h1>
          <p className="text-xl text-light/80 font-medium">
            {playlistTracks.length} {t.playlist.tracks}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-8 px-8">
        {(() => {
          const isSameQueue = queue.length > 0 && queue.length === playlistTracks.length && queue.every((t, i) => t.id === playlistTracks[i].id);
          const isPlaylistPlaying = isSameQueue && isPlaying;
          
          const handlePlayAllClick = () => {
            if (playlistTracks.length === 0) return;
            if (isSameQueue) {
              togglePlayPause();
            } else {
              playTrack(playlistTracks[0], playlistTracks);
            }
          };

          return (
            <button 
              onClick={handlePlayAllClick}
              disabled={playlistTracks.length === 0}
              className="bg-secondary text-dark font-bold px-8 py-4 rounded-full flex items-center gap-3 hover:scale-105 transition-transform disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
            >
              {isPlaylistPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
              {isPlaylistPlaying ? t.playlistDetail.pause : t.playlistDetail.playAll}
            </button>
          );
        })()}

        <div className="flex items-center gap-2 bg-dark-alt p-1 rounded-full border border-white/5">
          <button 
            onClick={() => setViewMode("table")}
            className={`p-3 rounded-full transition-colors ${viewMode === "table" ? "bg-white/10 text-secondary" : "text-light/50 hover:text-light"}`}
          >
            <List className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setViewMode("grid")}
            className={`p-3 rounded-full transition-colors ${viewMode === "grid" ? "bg-white/10 text-secondary" : "text-light/50 hover:text-light"}`}
          >
            <Grid className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-8">
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
                  playCount={decodedId === 'most_played' ? track.play_count : undefined}
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
            <div className={`grid ${decodedId === 'most_played' ? 'grid-cols-[2.5rem_1fr_3.75rem_4rem] md:grid-cols-[2.5rem_1fr_1fr_3.75rem_4rem] lg:grid-cols-[2.5rem_1fr_1fr_1fr_3.75rem_4rem]' : 'grid-cols-[2.5rem_1fr_3.75rem] md:grid-cols-[2.5rem_1fr_1fr_3.75rem] lg:grid-cols-[2.5rem_1fr_1fr_1fr_3.75rem]'} gap-4 px-6 py-4 border-b border-white/5 text-light/50 text-sm font-semibold uppercase tracking-wider mb-2`}>
              <div>#</div>
              <div>{(t as any).playlistDetail?.track || "TITLE"}</div>
              <div className="hidden md:block">{(t as any).playlistDetail?.artist || "ARTIST"}</div>
              <div className="hidden lg:block">{(t as any).playlistDetail?.album || "ALBUM"}</div>
              <div className="flex justify-end"><Clock className="w-4 h-4" /></div>
              {decodedId === 'most_played' && <div className="text-right">{t.playlistDetail.plays}</div>}
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
                className={`grid ${decodedId === 'most_played' ? 'grid-cols-[2.5rem_1fr_3.75rem_4rem] md:grid-cols-[2.5rem_1fr_1fr_3.75rem_4rem] lg:grid-cols-[2.5rem_1fr_1fr_1fr_3.75rem_4rem]' : 'grid-cols-[2.5rem_1fr_3.75rem] md:grid-cols-[2.5rem_1fr_1fr_3.75rem] lg:grid-cols-[2.5rem_1fr_1fr_1fr_3.75rem]'} gap-4 px-6 py-4 items-center rounded-xl transition-colors group cursor-pointer ${isCurrent ? 'bg-white/10' : 'hover:bg-white/5'}`}
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
                  <Link 
                    to={`/track/${encodeURIComponent(track.path)}`}
                    onClick={(e) => e.stopPropagation()}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all text-light/50 hover:text-light"
                    title="Edit Track"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Link>
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
                {decodedId === 'most_played' && (
                  <div className="text-light/50 text-right font-medium">
                    {track.play_count || 0}
                  </div>
                )}
              </div>
            )})}
          </div>
        )}
      </div>

      {/* Rename Modal */}
      {isRenameModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsRenameModalOpen(false)}
          />
          <div className="relative bg-dark-alt w-full max-w-md rounded-3xl p-8 border border-white/10">
            <button 
              onClick={() => setIsRenameModalOpen(false)}
              className="absolute top-6 right-6 text-light/50 hover:text-light transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-bold text-light mb-2">{t.playlistDetail.renameTitle}</h2>
            <p className="text-light/50 mb-6">{t.playlistDetail.renameDesc}</p>
            
            <form onSubmit={handleRename}>
              <input
                autoFocus
                type="text"
                placeholder={t.playlistDetail.renamePlaceholder}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full bg-dark text-light rounded-xl px-4 py-4 mb-6 border border-white/10 focus:border-secondary focus:outline-none transition-colors"
              />
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsRenameModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-light bg-white/5 hover:bg-white/10 transition-colors"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isRenaming || !newFolderName.trim() || newFolderName.trim() === collectionName}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-dark bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRenaming ? t.common.saving : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
