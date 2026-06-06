import { useTranslation } from "../../../i18n";
import { Play, Pause } from "lucide-react";
import { useLibrary } from "../../../contexts/LibraryContext";
import { useAudio } from "../../../contexts/AudioContext";
import { TrackCover } from "../../../components/Cards/TrackCover";
import { Link, useNavigate } from "react-router-dom";

export function TopChartsSection() {
  const { t } = useTranslation();
  const { tracks } = useLibrary();
  const { currentTrack, isPlaying, togglePlayPause, playTrack } = useAudio();
  const navigate = useNavigate();

  if (tracks.length === 0) return null;

  // Get most played tracks
  const allTopTracks = [...tracks]
    .filter(t => t.play_count > 0)
    .sort((a, b) => b.play_count - a.play_count);
    
  const topTracks = allTopTracks.slice(0, 4);

  if (topTracks.length === 0) return null;

  return (
    <div className="flex flex-col w-full xl:w-[350px] shrink-0 animate-fade-in h-[25rem] md:h-[28rem]">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h2 className="text-2xl font-bold text-light">
          {t.home.mostPlayed}
        </h2>
      </div>
      
      <div className="flex flex-col gap-4 relative overflow-hidden h-[336px] md:h-[350px]">
        {topTracks.map((chart, index) => {
          const isCurrent = currentTrack?.id === chart.id;

          return (
            <div 
              key={chart.id}
              className="flex items-center gap-4 bg-dark-alt hover:bg-white/5 transition-colors p-3 rounded-2xl cursor-pointer group shrink-0"
              onClick={() => {
                if (isCurrent) togglePlayPause();
                else playTrack(chart, topTracks.filter((_, i) => i < 3));
              }}
            >
              <div className="text-xl font-bold text-light opacity-30 w-6 text-center">
                {index + 1}
              </div>
              
              <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
                <TrackCover path={chart.path} className="w-full h-full object-cover" />
                <div className={`absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center backdrop-blur-[2px] ${isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {isCurrent && isPlaying ? (
                    <Pause className="w-6 h-6 text-white fill-current" />
                  ) : (
                    <Play className="w-6 h-6 text-white fill-current" />
                  )}
                </div>
              </div>
              
              <div className="flex flex-col flex-1 overflow-hidden">
                <Link to={`/track/${encodeURIComponent(chart.path)}`} onClick={e => e.stopPropagation()} className="text-light font-bold truncate text-base hover:text-secondary transition-colors inline-block w-fit">
                  {chart.title}
                </Link>
                <p className="text-light/50 text-sm font-medium truncate">{chart.artist || t.home.unknownArtist}</p>
              </div>
            </div>
          );
        })}

        {/* Global Fade Overlay for "See More" */}
        {allTopTracks.length > 3 && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-[100px] bg-gradient-to-t from-dark via-dark/90 to-transparent flex flex-col items-center justify-end pb-2 cursor-pointer group z-10"
            onClick={() => navigate('/playlist', { state: { tab: 'most_played' } })}
          >
            <span className="text-light font-bold text-sm tracking-wider uppercase group-hover:text-secondary transition-all group-hover:scale-105 bg-dark/50 px-4 py-1 rounded-full backdrop-blur-md border border-white/5">
              {t.home.seeMore}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
