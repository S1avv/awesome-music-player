import { Track } from "../../contexts/LibraryContext";
import { useState, useEffect } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";

interface PlaylistCoverProps {
  playlist: { cover_path?: string | null; tracks: string[] } | null;
  allTracks: Track[];
  className?: string;
  fallbackImage?: string;
}

export function PlaylistCover({ playlist, allTracks, className = "", fallbackImage = "/PhonographRecord.png" }: PlaylistCoverProps) {
  const [covers, setCovers] = useState<string[]>([]);

  useEffect(() => {
    if (playlist?.cover_path) {
      setCovers([playlist.cover_path]);
      return;
    }

    if (!playlist || playlist.tracks.length === 0) {
      setCovers([]);
      return;
    }

    const fetchCovers = async () => {
      const playlistTracks = playlist.tracks.map(p => allTracks.find(t => t.path === p)).filter(Boolean) as Track[];
      const fetchedCovers: string[] = [];
      const uniquePaths = new Set<string>();

      for (const t of playlistTracks) {
        if (uniquePaths.size >= 4) break;
        try {
          const cover = await invoke<string>("get_track_cover", { path: t.path });
          if (cover && !uniquePaths.has(cover)) {
            uniquePaths.add(cover);
            fetchedCovers.push(cover);
          }
        } catch (e) {
          // ignore
        }
      }
      setCovers(fetchedCovers);
    };

    fetchCovers();
  }, [playlist, allTracks]);

  const getImageUrl = (path: string) => {
    if (!path) return path;
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    if (path.startsWith('/Phono')) return path;
    try {
      return convertFileSrc(path);
    } catch(e) {
      return path;
    }
  };

  if (playlist?.cover_path) {
    return (
      <div 
        className={`bg-cover bg-center ${className}`}
        style={{ backgroundImage: `url('${getImageUrl(playlist.cover_path)}')` }}
      />
    );
  }

  if (covers.length >= 4) {
    return (
      <div className={`grid grid-cols-2 grid-rows-2 ${className}`}>
        {covers.slice(0, 4).map((c, i) => (
          <div key={i} className="bg-cover bg-center w-full h-full" style={{ backgroundImage: `url('${c}')` }} />
        ))}
      </div>
    );
  } else if (covers.length >= 2) {
    return (
      <div className={`grid grid-cols-2 ${className}`}>
        {covers.slice(0, 2).map((c, i) => (
          <div key={i} className="bg-cover bg-center w-full h-full" style={{ backgroundImage: `url('${c}')` }} />
        ))}
      </div>
    );
  } else if (covers.length >= 1) {
    return (
      <div 
        className={`bg-cover bg-center ${className}`}
        style={{ backgroundImage: `url('${covers[0]}')` }}
      />
    );
  }

  return (
    <div 
      className={`bg-cover bg-center ${className}`}
      style={{ backgroundImage: `url('${fallbackImage}')` }}
    />
  );
}
