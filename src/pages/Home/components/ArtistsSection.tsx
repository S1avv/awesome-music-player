import { useTranslation } from "../../../i18n";
import { Section } from "./Section";
import { ArtistCard } from "../../../components/Cards/ArtistCard";
import { useLibrary } from "../../../contexts/LibraryContext";
import { useNavigate } from "react-router-dom";

export function ArtistsSection() {
  const { t } = useTranslation();
  const { tracks } = useLibrary();
  const navigate = useNavigate();

  if (tracks.length === 0) return null;

  // Extract unique artists
  const uniqueArtistsMap = new Map();
  tracks.forEach(t => {
    if (t.artist && !uniqueArtistsMap.has(t.artist)) {
      uniqueArtistsMap.set(t.artist, t.path);
    }
  });

  const uniqueArtists = Array.from(uniqueArtistsMap.entries())
    .slice(0, 10)
    .map(([name, path], index) => ({
      id: index,
      name: name,
      trackPath: path
    }));

  // If no artists were found in metadata, we can either hide or show a generic
  if (uniqueArtists.length === 0) return null;

  return (
    <Section title={t.home.yourArtists} onSeeAll={() => navigate('/artists')}>
      {uniqueArtists.map((item) => (
        <ArtistCard 
          key={item.id}
          name={item.name}
          trackPath={item.trackPath}
          onClick={() => navigate(`/artist/${encodeURIComponent(item.name)}`)}
        />
      ))}
    </Section>
  );
}
