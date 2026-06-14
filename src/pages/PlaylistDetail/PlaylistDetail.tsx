import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { useLibrary, Track } from "../../contexts/LibraryContext";
import { useAudio } from "../../contexts/AudioContext";
import { useTranslation } from "../../i18n";
import { Play, Pause, Grid, List, ArrowLeft, Clock, Pencil, X, AudioLines, Search, ChevronUp, ChevronDown, Trash2, GripVertical } from "lucide-react";
import { Reorder } from "framer-motion";
import { CoverSearchModal } from "../../components/Modals/CoverSearchModal";
import { MediaCard } from "../../components/Cards/MediaCard";
import { PlaylistCover } from "../../components/Cards/PlaylistCover";
import { TrackMenu } from "../../components/ContextMenu/TrackMenu";

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
  const { playlists, tracks, updatePlaylist, removeTrackFromPlaylist, deletePlaylist, reorderPlaylistTracks } = useLibrary();
  const { playTrack, currentTrack, isPlaying, togglePlayPause, queue } = useAudio();
  
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  
  const [coverPath, setCoverPath] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);

  const [sortConfig, setSortConfig] = useState<{key: keyof Track, direction: 'asc'|'desc'} | null>(null);

  if (!id) return null;
  
  const decodedId = decodeURIComponent(id).replace(/\\/g, '/');

  const playlist = playlists.find(c => c.id === decodedId);
  let collectionName = playlist ? playlist.name : t.playlistDetail.playlist;
  let collectionImage = playlist?.cover_path ? playlist.cover_path : "/PhonographRecord.png";

  if (decodedId === "main_library") collectionName = t.playlist.allTracks;
  if (decodedId === "recently_added") collectionName = t.playlist.recentlyAdded;
  if (decodedId === "most_played") collectionName = t.playlist.mostPlayed;

  const playlistTracks = useMemo(() => {
    if (decodedId === "main_library") {
      return tracks;
    } else if (decodedId === "recently_added") {
      return [...tracks].sort((a, b) => b.added_at - a.added_at);
    } else if (decodedId === "most_played") {
      return [...tracks].filter(t => t.play_count > 0).sort((a, b) => b.play_count - a.play_count);
    } else if (playlist) {
      return playlist.tracks.map(p => tracks.find(t => t.path === p)).filter(Boolean) as Track[];
    }
    return [];
  }, [tracks, decodedId, playlist]);

  const isSpecialPlaylist = ["main_library", "recently_added", "most_played"].includes(decodedId);

  const handleSort = (key: keyof Track) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedTracks = useMemo(() => {
    const sorted = [...playlistTracks];
    if (sortConfig !== null) {
      sorted.sort((a, b) => {
        const aVal = a[sortConfig.key] ?? '';
        const bVal = b[sortConfig.key] ?? '';
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [playlistTracks, sortConfig]);

  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const [isEditingList, setIsEditingList] = useState(false);

  useEffect(() => {
    setLocalTracks(sortedTracks);
  }, [sortedTracks]);

  const handleReorder = async (newOrder: Track[]) => {
    setLocalTracks(newOrder);
    if (!playlist || isSpecialPlaylist) return;
    try {
      await reorderPlaylistTracks(playlist.id, newOrder.map(t => t.path));
    } catch (e) {
      console.error(e);
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: keyof Track }) => {
    if (sortConfig?.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 inline" /> : <ChevronDown className="w-3 h-3 ml-1 inline" />;
  };

  const openRenameModal = () => {
    setNewFolderName(collectionName);
    setCoverPath(playlist?.cover_path || null);
    setCoverPreview(collectionImage);
    setIsRenameModalOpen(true);
  };

  const handleSelectLocalCover = (selectedPath: string) => {
    setIsCoverModalOpen(false);
    setCoverPath(selectedPath);
    import("@tauri-apps/api/core").then(({ convertFileSrc }) => {
      setCoverPreview(convertFileSrc(selectedPath));
    });
  };

  const handleSelectWebCover = async (url: string) => {
    setIsCoverModalOpen(false);
    setCoverPreview(url);
    try {
      const localPath = await invoke<string>("download_image_to_temp", { url });
      setCoverPath(localPath);
    } catch (e) {
      console.error("Failed to download image:", e);
    }
  };

  const handleSavePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !playlist) return;

    setIsRenaming(true);
    try {
      await updatePlaylist(playlist.id, newFolderName.trim(), playlist.description, coverPath !== null ? coverPath : undefined);
      setIsRenameModalOpen(false);
    } catch (error) {
      console.error("Failed to rename playlist:", error);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!playlist) return;
    if (confirm((t as any).playlistDetail?.confirmDelete || "Are you sure you want to delete this playlist?")) {
      try {
        await deletePlaylist(playlist.id);
        navigate("/playlist");
      } catch (e) {
        console.error("Failed to delete playlist:", e);
      }
    }
  };

  return (
    <div className="w-full flex flex-col pb-12 animate-fade-in">
      
      {/* Header Banner */}
      <div className="relative w-full h-[19rem] md:h-[22rem] rounded-[3rem] overflow-hidden group mb-8 flex-shrink-0">
        <PlaylistCover 
          playlist={playlist || null}
          allTracks={tracks}
          className="absolute inset-0 transition-transform duration-700"
          fallbackImage={collectionImage}
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
            <>
              <button 
                onClick={openRenameModal}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors text-light cursor-pointer"
                title={t.playlistDetail.renameTitle}
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button 
                onClick={handleDeletePlaylist}
                className="p-3 bg-red-500/20 hover:bg-red-500/40 rounded-full backdrop-blur-md transition-colors text-red-500 cursor-pointer"
                title={(t as any).playlistDetail?.deletePlaylist || "Delete Playlist"}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
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
          const isSameQueue = queue.length > 0 && queue.length === sortedTracks.length && queue.every((t, i) => t.id === sortedTracks[i].id);
          const isPlaylistPlaying = isSameQueue && isPlaying;
          
          const handlePlayAllClick = () => {
            if (sortedTracks.length === 0) return;
            if (isSameQueue) {
              togglePlayPause();
            } else {
              playTrack(sortedTracks[0], sortedTracks);
            }
          };

          return (
            <button 
              onClick={handlePlayAllClick}
              disabled={sortedTracks.length === 0}
              className="bg-secondary text-dark font-bold px-8 py-4 rounded-full flex items-center gap-3 hover:scale-105 transition-transform disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
            >
              {isPlaylistPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
              {isPlaylistPlaying ? (t as any).playlistDetail?.pause || "Pause" : (t as any).playlistDetail?.playAll || "Play All"}
            </button>
          );
        })()}

        <div className="flex items-center gap-2">
          {!isSpecialPlaylist && viewMode === "table" && (
            <button
              onClick={() => setIsEditingList(!isEditingList)}
              className={`px-4 py-2 rounded-full font-bold transition-colors ${isEditingList ? 'bg-secondary text-dark' : 'bg-white/10 text-light hover:bg-white/20'}`}
            >
              {isEditingList ? ((t as any).common?.done || "Done") : ((t as any).playlistDetail?.editList || "Edit List")}
            </button>
          )}
          <div className="flex items-center gap-2 bg-dark-alt p-1 rounded-full border border-white/5 ml-4">
            <button 
              onClick={() => { setViewMode("table"); setIsEditingList(false); }}
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
      </div>

      {/* Content */}
      <div className="px-8">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6">
            {sortedTracks.map((track) => (
              <div key={track.id} className="min-w-0">
                <MediaCard 
                  title={track.title}
                  subtitle={track.artist || t.home.unknownArtist}
                  trackPath={track.path}
                  titleHref={`/track/${encodeURIComponent(track.path)}`}
                  isCurrentTrack={currentTrack?.id === track.id}
                  isPlaying={isPlaying}
                  playCount={decodedId === 'most_played' ? track.play_count : undefined}
                  track={track}
                  playlistTracks={sortedTracks}
                  onPlayPauseClick={(e) => {
                    e.stopPropagation();
                    if (currentTrack?.id === track.id) {
                      togglePlayPause();
                    } else {
                      playTrack(track, sortedTracks);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col w-full">
            {/* Table Header */}
            <div className={`grid ${decodedId === 'most_played' ? 'grid-cols-[2.5rem_1fr_3.75rem_4rem_3rem] md:grid-cols-[2.5rem_1fr_1fr_3.75rem_4rem_3rem] lg:grid-cols-[2.5rem_1fr_1fr_1fr_3.75rem_4rem_3rem]' : 'grid-cols-[2.5rem_1fr_3.75rem_3rem] md:grid-cols-[2.5rem_1fr_1fr_3.75rem_3rem] lg:grid-cols-[2.5rem_1fr_1fr_1fr_3.75rem_3rem]'} gap-4 px-6 py-4 border-b border-white/5 text-light/50 text-sm font-semibold uppercase tracking-wider mb-2`}>
              <div>#</div>
               <button onClick={() => isSpecialPlaylist && handleSort('title')} className={`text-left flex items-center transition-colors ${isSpecialPlaylist ? 'hover:text-light' : 'cursor-default'}`}>{(t as any).playlistDetail?.track || "TITLE"}<SortIcon columnKey="title" /></button>
              <button onClick={() => isSpecialPlaylist && handleSort('artist')} className={`hidden md:flex items-center text-left transition-colors ${isSpecialPlaylist ? 'hover:text-light' : 'cursor-default'}`}>{(t as any).playlistDetail?.artist || "ARTIST"}<SortIcon columnKey="artist" /></button>
              <button onClick={() => isSpecialPlaylist && handleSort('album')} className={`hidden lg:flex items-center text-left transition-colors ${isSpecialPlaylist ? 'hover:text-light' : 'cursor-default'}`}>{(t as any).playlistDetail?.album || "ALBUM"}<SortIcon columnKey="album" /></button>
              <button onClick={() => isSpecialPlaylist && handleSort('duration')} className={`flex justify-end items-center transition-colors ml-auto ${isSpecialPlaylist ? 'hover:text-light' : 'cursor-default'}`}><Clock className="w-4 h-4 mr-1" /><SortIcon columnKey="duration" /></button>
              {decodedId === 'most_played' && <button onClick={() => handleSort('play_count')} className={`text-right flex justify-end items-center hover:text-light transition-colors ml-auto ${isSpecialPlaylist ? 'hover:text-light' : 'cursor-default'}`}>{t.playlistDetail.plays}<SortIcon columnKey="play_count" /></button>}
              <div></div>
            </div>

            {/* Table Rows */}
            {isSpecialPlaylist ? (
              sortedTracks.map((track, index) => {
                const isCurrent = currentTrack?.id === track.id;
                return (
                <div 
                  key={track.id}
                  onClick={() => {
                    if (isCurrent) togglePlayPause();
                    else playTrack(track, sortedTracks);
                  }}
                  className={`grid ${decodedId === 'most_played' ? 'grid-cols-[2.5rem_1fr_3.75rem_4rem_3rem] md:grid-cols-[2.5rem_1fr_1fr_3.75rem_4rem_3rem] lg:grid-cols-[2.5rem_1fr_1fr_1fr_3.75rem_4rem_3rem]' : 'grid-cols-[2.5rem_1fr_3.75rem_3rem] md:grid-cols-[2.5rem_1fr_1fr_3.75rem_3rem] lg:grid-cols-[2.5rem_1fr_1fr_1fr_3.75rem_3rem]'} gap-4 px-6 py-4 items-center rounded-xl transition-colors group cursor-pointer ${isCurrent ? 'bg-white/10' : 'hover:bg-white/5'}`}
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
                  {decodedId === 'most_played' && (
                    <div className="text-light/50 text-right font-medium">
                      {track.play_count || 0}
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-1">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <TrackMenu track={track} playlistTracks={sortedTracks} />
                    </div>
                  </div>
                </div>
              )})
            ) : (
              <Reorder.Group axis="y" values={localTracks} onReorder={handleReorder} className="flex flex-col">
                {localTracks.map((track, index) => {
                  const isCurrent = currentTrack?.id === track.id;
                  return (
                  <Reorder.Item 
                    key={track.id}
                    value={track}
                    dragListener={isEditingList}
                    onClick={() => {
                      if (!isEditingList) {
                        if (isCurrent) togglePlayPause();
                        else playTrack(track, localTracks);
                      }
                    }}
                    className={`grid grid-cols-[2.5rem_1fr_3.75rem_3rem] md:grid-cols-[2.5rem_1fr_1fr_3.75rem_3rem] lg:grid-cols-[2.5rem_1fr_1fr_1fr_3.75rem_3rem] gap-4 px-6 py-4 items-center rounded-xl transition-colors group ${isEditingList ? 'cursor-default' : 'cursor-pointer'} ${isCurrent ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  >
                    {!isEditingList && (
                      <div className={`font-medium group-hover:hidden ${isCurrent ? 'text-secondary' : 'text-light/50'}`}>
                        {isCurrent && isPlaying ? <AudioLines className="w-4 h-4 text-secondary animate-pulse" /> : index + 1}
                      </div>
                    )}
                    {isEditingList ? (
                      <div className="flex items-center justify-center text-light/30 hover:text-light/50 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="hidden group-hover:flex items-center text-secondary">
                        {isCurrent && isPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current" />
                        )}
                      </div>
                    )}
                    
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
                    <div className="flex items-center justify-end gap-1">
                      {playlist && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTrackFromPlaylist(playlist.id, track.path);
                          }}
                          className="p-1.5 text-light/50 hover:text-red-500 hover:bg-white/10 rounded-full transition-all opacity-0 group-hover:opacity-100"
                          title="Remove from Playlist"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <TrackMenu track={track} playlistTracks={localTracks} />
                      </div>
                    </div>
                  </Reorder.Item>
                )})}
              </Reorder.Group>
            )}
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
          <div className="relative bg-dark-alt w-full max-w-2xl rounded-3xl p-8 border border-white/10 flex flex-col md:flex-row gap-8">
            <button 
              onClick={() => setIsRenameModalOpen(false)}
              className="absolute top-6 right-6 text-light/50 hover:text-light transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="w-full md:w-1/3 flex flex-col gap-4">
              <div 
                className="w-full aspect-square rounded-3xl overflow-hidden relative group cursor-pointer border border-white/10"
                onClick={() => setIsCoverModalOpen(true)}
              >
                <img 
                  src={coverPreview} 
                  alt="Cover Preview" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-light backdrop-blur-sm">
                  <Search className="w-8 h-8" />
                  <span className="font-bold">{t.trackDetail?.changeCover || "Change Cover"}</span>
                </div>
              </div>
              
              {coverPath && (
                <button 
                  type="button"
                  onClick={() => {
                    setCoverPath("");
                    setCoverPreview("");
                  }}
                  className="w-full py-2.5 text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl font-bold transition-colors"
                >
                  {(t as any).playlistDetail?.removeCover || "Remove Cover"}
                </button>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-2xl font-bold text-light mb-2">{t.playlistDetail.renameTitle}</h2>
              <p className="text-light/50 mb-6">{t.playlistDetail.renameDesc}</p>
              
              <form onSubmit={handleSavePlaylist}>
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
                    disabled={isRenaming || !newFolderName.trim()}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-dark bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isRenaming ? t.common.saving : t.common.save}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      <CoverSearchModal 
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        initialQuery={newFolderName}
        onSelectLocalFile={handleSelectLocalCover}
        onSelectWebUrl={handleSelectWebCover}
      />

    </div>
  );
}
