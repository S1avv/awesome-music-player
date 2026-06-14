import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check } from "lucide-react";
import { useLibrary } from "../../contexts/LibraryContext";
import { useTranslation } from "../../i18n";

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackPath: string;
}

export function AddToPlaylistModal({ isOpen, onClose, trackPath }: AddToPlaylistModalProps) {
  const { t } = useTranslation();
  const { playlists, addTrackToPlaylist, removeTrackFromPlaylist } = useLibrary();
  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set());
  const [initialPlaylists, setInitialPlaylists] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  // Only show custom playlists
  const customPlaylists = playlists.filter(p => p.id !== "main_library");

  useEffect(() => {
    if (isOpen) {
      const initial = new Set<string>();
      customPlaylists.forEach(p => {
        if (p.tracks.includes(trackPath)) {
          initial.add(p.id);
        }
      });
      setInitialPlaylists(initial);
      setSelectedPlaylists(new Set(initial));
    }
  }, [isOpen, trackPath, playlists]);

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    const newSet = new Set(selectedPlaylists);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedPlaylists(newSet);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Find what to add
      for (const id of Array.from(selectedPlaylists)) {
        if (!initialPlaylists.has(id)) {
          await addTrackToPlaylist(id, trackPath);
        }
      }
      // Find what to remove
      for (const id of Array.from(initialPlaylists)) {
        if (!selectedPlaylists.has(id)) {
          await removeTrackFromPlaylist(id, trackPath);
        }
      }
      onClose();
    } catch (e) {
      console.error("Failed to update playlists:", e);
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-dark-alt w-full max-w-sm rounded-3xl p-6 border border-white/10 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-light flex items-center gap-2">
            {(t as any).playlistDetail?.addToPlaylist || "Add to Playlist"}
          </h2>
          <button onClick={onClose} className="text-light/50 hover:text-light transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mb-6 pr-2 flex flex-col gap-2">
          {customPlaylists.length === 0 ? (
            <div className="text-light/50 text-center py-4 text-sm">
              No playlists found. Create one first!
            </div>
          ) : (
            customPlaylists.map(playlist => {
              const isSelected = selectedPlaylists.has(playlist.id);
              return (
                <div 
                  key={playlist.id}
                  onClick={() => handleToggle(playlist.id)}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors shrink-0 ${isSelected ? 'bg-secondary border-secondary text-dark' : 'border-white/20 group-hover:border-white/40'}`}>
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    <div 
                      className="w-10 h-10 rounded-lg bg-cover bg-center shrink-0 border border-white/10"
                      style={{ backgroundImage: `url('${playlist.cover_path || '/PhonographRecord.png'}')` }}
                    />
                    <span className="text-light font-medium truncate">{playlist.name}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-secondary text-dark font-bold py-3 rounded-xl hover:bg-secondary/80 transition-colors disabled:opacity-50"
        >
          {isSaving ? t.common.saving : t.common.save}
        </button>
      </div>
    </div>,
    document.body
  );
}
