import { useTranslation } from "../../../i18n";
import { Section } from "./Section";
import { useNavigate } from "react-router-dom";
import { MediaCard } from "../../../components/Cards/MediaCard";
import { useLibrary } from "../../../contexts/LibraryContext";
import { useAudio } from "../../../contexts/AudioContext";


export function TrendingSection() {
  const { t } = useTranslation();
  const { tracks } = useLibrary();
  const { currentTrack, isPlaying, togglePlayPause, playTrack } = useAudio();
  const navigate = useNavigate();

  if (tracks.length === 0) return null;

  // Show up to 10 recently added/scanned tracks
  const recentTracks = [...tracks].sort((a, b) => (b.added_at || 0) - (a.added_at || 0)).slice(0, 10);

  return (
    <Section title={t.home.recentlyAdded} onSeeAll={() => navigate('/playlist', { state: { tab: 'recently_added' } })}>
      {recentTracks.map((item) => (
        <div key={item.id} className="w-[160px] md:w-[200px] flex-shrink-0">
          <MediaCard 
            title={item.title}
            subtitle={item.artist || t.home.unknownArtist}
            trackPath={item.path}
            titleHref={`/track/${encodeURIComponent(item.path)}`}
            isCurrentTrack={currentTrack?.id === item.id}
            isPlaying={isPlaying}
            track={item}
            playlistTracks={recentTracks}
            onPlayPauseClick={(e) => {
               e.stopPropagation();
               if (currentTrack?.id === item.id) {
                 togglePlayPause();
               } else {
                 playTrack(item, recentTracks);
               }
            }}
          />
        </div>
      ))}
    </Section>
  );
}
