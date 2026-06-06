import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useLibrary } from "../../contexts/LibraryContext";
import { useAudio } from "../../contexts/AudioContext";
import { useTranslation } from "../../i18n";
import { Play, Pause, Grid, List, ArrowLeft, Clock, Edit3, AudioLines } from "lucide-react";
import { MediaCard } from "../../components/Cards/MediaCard";
import { Link } from "react-router-dom";
import { TrackCover } from "../../components/Cards/TrackCover";

function formatTime(seconds: number) {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ArtistDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { tracks } = useLibrary();
  const { playTrack, currentTrack, isPlaying, togglePlayPause, queue } = useAudio();
  
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  if (!name) return null;
  const decodedName = decodeURIComponent(name);

  const artistTracks = tracks.filter(track => {
    const trackArtist = track.artist || t.home.unknownArtist;
    return trackArtist === decodedName;
  });

  const totalDuration = artistTracks.reduce((acc, track) => acc + (track.duration || 0), 0);
  const firstTrackPath = artistTracks.length > 0 ? artistTracks[0].path : undefined;

  return (
    <div className="w-full flex flex-col pb-24 animate-fade-in px-2 md:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-8 px-8 mt-4">
        <button 
          onClick={() => navigate(-1)}
          className="bg-white/5 hover:bg-white/10 p-3 rounded-full transition-colors self-start md:mt-2"
        >
          <ArrowLeft className="w-6 h-6 text-light" />
        </button>
        
        <div className="w-48 h-48 rounded-full overflow-hidden shrink-0 bg-dark-alt border border-white/10 relative">
          {firstTrackPath ? (
            <TrackCover path={firstTrackPath} className="w-full h-full object-cover" />
          ) : (
            <img src="/artist.jpg" alt={decodedName} className="w-full h-full object-cover" />
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold uppercase tracking-widest text-light/50">{t.artists.artistLabel}</span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-light tracking-tight">{decodedName}</h1>
          <p className="text-light/50 font-medium text-lg mt-2 flex items-center gap-2">
            {artistTracks.length} {t.playlist.tracks} • {formatTime(totalDuration)}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-8 px-8">
        {(() => {
          const isSameQueue = queue.length > 0 && queue.length === artistTracks.length && queue.every((t, i) => t.id === artistTracks[i].id);
          const isArtistPlaying = isSameQueue && isPlaying;
          
          const handlePlayAllClick = () => {
            if (artistTracks.length === 0) return;
            if (isSameQueue) {
              togglePlayPause();
            } else {
              playTrack(artistTracks[0], artistTracks);
            }
          };

          return (
            <button 
              onClick={handlePlayAllClick}
              disabled={artistTracks.length === 0}
              className="bg-secondary text-dark font-bold px-8 py-4 rounded-full flex items-center gap-3 hover:scale-105 transition-transform disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
            >
              {isArtistPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
              {isArtistPlaying ? t.playlistDetail.pause : t.playlistDetail.playAll}
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
            {artistTracks.map((track) => (
              <div key={track.id} className="min-w-0">
                <MediaCard 
                  title={track.title}
                  subtitle={track.album || t.playlistDetail.unknownAlbum}
                  trackPath={track.path}
                  titleHref={`/track/${encodeURIComponent(track.path)}`}
                  isCurrentTrack={currentTrack?.id === track.id}
                  isPlaying={isPlaying}
                  onPlayPauseClick={(e) => {
                    e.stopPropagation();
                    if (currentTrack?.id === track.id) {
                      togglePlayPause();
                    } else {
                      playTrack(track, artistTracks);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col w-full">
            {/* Table Header */}
            <div className="grid grid-cols-[2.5rem_1fr_3.75rem] md:grid-cols-[2.5rem_1fr_1fr_3.75rem] lg:grid-cols-[2.5rem_1fr_1fr_1fr_3.75rem] gap-4 px-6 py-4 border-b border-white/5 text-light/50 text-sm font-semibold uppercase tracking-wider mb-2">
              <div>#</div>
              <div>{(t as any).playlistDetail?.track || "TITLE"}</div>
              <div className="hidden md:block">{(t as any).playlistDetail?.artist || "ARTIST"}</div>
              <div className="hidden lg:block">{(t as any).playlistDetail?.album || "ALBUM"}</div>
              <div className="flex justify-end"><Clock className="w-4 h-4" /></div>
            </div>

            {/* Table Rows */}
            {artistTracks.map((track, index) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
              <div 
                key={track.id}
                onClick={() => {
                  if (isCurrent) togglePlayPause();
                  else playTrack(track, artistTracks);
                }}
                className={`grid grid-cols-[2.5rem_1fr_3.75rem] md:grid-cols-[2.5rem_1fr_1fr_3.75rem] lg:grid-cols-[2.5rem_1fr_1fr_1fr_3.75rem] gap-4 px-6 py-4 items-center rounded-xl transition-colors group cursor-pointer ${isCurrent ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                {/* # or Play/Pause Icon */}
                <div className="flex items-center justify-center w-full">
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
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}
