import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";

import { useLibrary } from "../../contexts/LibraryContext";
import { useNotification } from "../../contexts/NotificationContext";
import { useTranslation } from "../../i18n";
import { ArrowLeft, Save, Music, User, Disc, FolderPlus, Search, Check, ChevronDown, Trash2 } from "lucide-react";
import { CoverSearchModal } from "./components/CoverSearchModal";

function CustomSelect({ options, value, onChange, placeholder }: { options: {id: string, name: string}[], value: string, onChange: (val: string) => void, placeholder: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find(o => o.id === value);
  return (
    <div className="relative">
      <div 
        className="bg-dark-alt border border-white/10 text-light px-4 py-3 rounded-xl cursor-pointer flex justify-between items-center hover:border-secondary transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selected ? "text-light" : "text-light/50"}>{selected ? selected.name : placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-light/50 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 w-full mt-2 bg-dark-alt border border-white/10 rounded-xl overflow-hidden z-50 max-h-60 overflow-y-auto py-2">
            <div 
              className={`px-4 py-2 cursor-pointer hover:bg-white/5 transition-colors ${!value ? 'text-secondary font-bold' : 'text-light/70'}`}
              onClick={() => { onChange(""); setIsOpen(false); }}
            >
              {placeholder}
            </div>
            {options.map(opt => (
              <div 
                key={opt.id}
                className={`px-4 py-2 cursor-pointer hover:bg-white/5 transition-colors ${value === opt.id ? 'text-secondary font-bold' : 'text-light'}`}
                onClick={() => { onChange(opt.id); setIsOpen(false); }}
              >
                {opt.name}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function TrackDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { tracks, collections, scanLibrary } = useLibrary();
  const { showNotification } = useNotification();
  
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [coverPath, setCoverPath] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("/PhonographRecord.png");
  const [selectedAlbumFolder, setSelectedAlbumFolder] = useState<string>("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);

  const decodedPath = id ? decodeURIComponent(id).replace(/\\/g, '/') : "";
  const track = tracks.find(t => t.path.replace(/\\/g, '/') === decodedPath);

  useEffect(() => {
    if (track) {
      setTitle(track.title);
      setArtist(track.artist || "");
      setAlbum(track.album || "");
    
      invoke<string | null>("get_track_cover", { path: track.path })
        .then(cover => {
          if (cover) {
            setCoverPreview(cover);
          }
        })
        .catch(console.error);
    }
  }, [track]);

  if (!track) return <div className="p-8 text-light">{t.trackDetail.notFound}</div>;

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await invoke("update_track_metadata", {
        path: track.path,
        title,
        artist,
        album,
        coverPath
      });

      let finalPath = track.path;

      if (selectedAlbumFolder) {
        finalPath = await invoke<string>("move_track", {
          path: track.path,
          newFolder: selectedAlbumFolder
        });
      }

      // Re-scan library to pick up changes
      await scanLibrary();
      
      showNotification(t.trackDetail.saveSuccess, "success");
      setIsSaved(true);
      
      // Navigate to the new path if moved, otherwise go back
      if (selectedAlbumFolder) {
        navigate(`/track/${encodeURIComponent(finalPath)}`, { replace: true });
      } else {
        navigate(-1);
      }
    } catch (error) {
      console.error("Failed to save track:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!track) return;
    if (confirm(`${t.trackDetail.deleteConfirm} "${track.title}"?`)) {
      try {
        await invoke("delete_track", { path: track.path });
        await scanLibrary();
        navigate(-1);
      } catch (e) {
        console.error("Failed to delete track", e);
      }
    }
  };

  // Exclude main_library from target folders
  const targetAlbums = collections.filter(c => c.id !== "main_library");

  const hasChanges = 
    track && (
      title !== (track.title || "") ||
      artist !== (track.artist || "") ||
      album !== (track.album || "") ||
      coverPath !== null ||
      selectedAlbumFolder !== ""
    );

  return (
    <div className="flex-1 overflow-y-auto w-full relative">
      <div className="p-8 pb-32 max-w-5xl mx-auto animate-fade-in">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-light/50 hover:text-light mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {t.common.back}
        </button>

        <form onSubmit={handleSave} className="flex flex-col md:flex-row gap-12">
          {/* Cover Art Upload */}
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
                <span className="font-bold">{t.trackDetail.changeCover}</span>
              </div>
            </div>
            <p className="text-light/50 text-xs text-center">{t.trackDetail.coverFormatDesc}</p>
          </div>

          {/* Form Fields */}
          <div className="flex-1 flex flex-col gap-6">
            <h1 className="text-4xl font-black text-light mb-4">{t.trackDetail.editTrack}</h1>
            
            <div className="flex flex-col gap-2">
              <label className="text-light/50 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Music className="w-4 h-4" /> {t.trackDetail.titleLabel}
              </label>
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="bg-white/5 border border-white/10 text-light px-4 py-3 rounded-xl focus:outline-none focus:border-secondary transition-colors"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-light/50 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" /> {t.trackDetail.artistLabel}
              </label>
              <input 
                type="text" 
                value={artist}
                onChange={e => setArtist(e.target.value)}
                className="bg-white/5 border border-white/10 text-light px-4 py-3 rounded-xl focus:outline-none focus:border-secondary transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-light/50 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Disc className="w-4 h-4" /> {t.trackDetail.albumLabel}
              </label>
              <input 
                type="text" 
                value={album}
                onChange={e => setAlbum(e.target.value)}
                className="bg-white/5 border border-white/10 text-light px-4 py-3 rounded-xl focus:outline-none focus:border-secondary transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2 relative z-10">
              <label className="text-light/50 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <FolderPlus className="w-4 h-4" /> {t.trackDetail.moveToFolder}
              </label>
              <CustomSelect 
                options={targetAlbums.map(a => ({ id: a.id, name: a.name }))}
                value={selectedAlbumFolder}
                onChange={setSelectedAlbumFolder}
                placeholder={t.trackDetail.keepInCurrent}
              />
            </div>

            <div className="mt-4 flex gap-4 w-full">
              <button 
                type="button"
                onClick={() => navigate(-1)}
                className="bg-white/5 text-light hover:bg-white/10 font-bold px-8 py-4 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {t.common.cancel}
              </button>
              <button 
                type="submit"
                disabled={isSaving || !hasChanges}
                className={`font-bold px-8 py-4 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:hover:scale-100 ${isSaved ? 'bg-green-500 text-white' : 'bg-secondary text-dark hover:scale-105'}`}
              >
                {isSaved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5 fill-current" />}
                {isSaving ? t.common.saving : isSaved ? t.trackDetail.saved : t.trackDetail.saveChanges}
              </button>

              <button 
                type="button"
                onClick={handleDelete}
                className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-bold px-6 py-4 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 ml-auto group"
              >
                <Trash2 className="w-5 h-5 text-red-500 group-hover:text-white transition-colors" />
                <span className="hidden md:inline">{t.trackDetail.deleteTrack}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <CoverSearchModal 
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        initialQuery={`${artist} ${title}`.trim()}
        onSelectLocalFile={handleSelectLocalCover}
        onSelectWebUrl={handleSelectWebCover}
      />
    </div>
  );
}
