import { useTranslation } from "../../i18n";
import { useLibrary } from "../../contexts/LibraryContext";
import { ArtistCard } from "../../components/Cards/ArtistCard";
import { useNavigate } from "react-router-dom";

export function Artists() {
  const { t } = useTranslation();
  const { tracks } = useLibrary();
  const navigate = useNavigate();

  // Extract unique artists
  const uniqueArtistsMap = new Map();
  tracks.forEach(track => {
    const artistName = track.artist || t.home.unknownArtist;
    if (!uniqueArtistsMap.has(artistName)) {
      uniqueArtistsMap.set(artistName, { name: artistName, trackPath: track.path, count: 1 });
    } else {
      uniqueArtistsMap.get(artistName).count++;
    }
  });

  const uniqueArtists = Array.from(uniqueArtistsMap.values()).sort((a, b) => b.count - a.count);

  return (
    <div className="w-full flex flex-col gap-8 pb-12 animate-fade-in px-2 md:px-0">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-light mb-1">{t.artists.title}</h1>
          <p className="text-light/50 font-medium">{uniqueArtists.length} {t.artists.inLibrary}</p>
        </div>
      </div>
      
      {uniqueArtists.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {uniqueArtists.map((artist, idx) => (
            <ArtistCard 
              key={idx}
              name={artist.name}
              trackPath={artist.trackPath}
              onClick={() => navigate(`/artist/${encodeURIComponent(artist.name)}`)}
            />
          ))}
        </div>
      ) : (
        <div className="text-light/50 text-center py-12">
          {t.artists.noArtistsFound}
        </div>
      )}
    </div>
  );
}
