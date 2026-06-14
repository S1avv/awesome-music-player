import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useSettings } from "../../hooks/useSettings";
import { useNotification } from "../../contexts/NotificationContext";
import { CloudArrowUpIcon, FolderOpenIcon } from "@heroicons/react/24/outline";
import { useLibrary } from "../../contexts/LibraryContext";
import { useAudio } from "../../contexts/AudioContext";
import { useTranslation } from "../../i18n";
import { MediaCard } from "../../components/Cards/MediaCard";

export function Upload() {
  const { t } = useTranslation();
  const { libraryPath } = useSettings();
  const { showNotification } = useNotification();
  const { tracks } = useLibrary();
  const { currentTrack, isPlaying, togglePlayPause, playTrack } = useAudio();

  const handleUploadTracks = async () => {
    if (!libraryPath) {
      showNotification(t.upload.libraryNotSet, "error");
      return;
    }

    try {
      const selectedFiles = await open({
        multiple: true,
        filters: [{
          name: "Audio",
          extensions: ["mp3", "wav", "flac", "m4a"]
        }]
      });

      if (selectedFiles && Array.isArray(selectedFiles) && selectedFiles.length > 0) {
        await invoke<number>("copy_tracks", { 
          files: selectedFiles,
          destFolder: libraryPath
        });
      }
    } catch (e) {
      console.error(e);
      showNotification(t.upload.uploadFailed, "error");
    }
  };

  const handleOpenFolder = async () => {
    if (!libraryPath) return;
    try {
      await invoke("open_folder_in_explorer", { path: libraryPath });
    } catch (e) {
      console.error(e);
      showNotification(t.upload.openFailed, "error");
    }
  };

  return (
    <div className="w-full h-full flex flex-col pb-24 px-4 md:px-8 overflow-y-auto animate-fade-in gap-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Upload Card */}
        <button 
          onClick={handleUploadTracks}
          className="flex-1 bg-dark-alt hover:bg-white/5 border border-white/5 hover:border-white/20 transition-all duration-300 rounded-[2rem] p-12 flex flex-col items-center justify-center gap-6 group"
        >
          <div className="w-24 h-24 rounded-full bg-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <CloudArrowUpIcon className="w-12 h-12 text-secondary" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-light mb-2">{t.upload.uploadFiles}</h2>
            <p className="text-light/50 max-w-xs mx-auto">{t.upload.uploadDesc}</p>
          </div>
        </button>

        {/* Open Folder Card */}
        <button 
          onClick={handleOpenFolder}
          className="flex-1 bg-dark-alt hover:bg-white/5 border border-white/5 hover:border-white/20 transition-all duration-300 rounded-[2rem] p-12 flex flex-col items-center justify-center gap-6 group"
        >
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <FolderOpenIcon className="w-12 h-12 text-light" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-light mb-2">{t.home.openFolder}</h2>
            <p className="text-light/50 max-w-xs mx-auto">{t.upload.openDesc}</p>
          </div>
        </button>
      </div>

      {tracks.length > 0 && (
        <div className="mt-8 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-light">{t.playlist.allTracks}</h2>
            <span className="text-light/50 font-medium">{tracks.length} {t.playlist.tracks}</span>
          </div>
          
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-6">
            {tracks.map((track) => (
              <div key={track.id} className="min-w-0">
                <MediaCard 
                  title={track.title}
                  subtitle={track.artist || t.home.unknownArtist}
                  trackPath={track.path}
                  titleHref={`/track/${encodeURIComponent(track.path)}`}
                  isCurrentTrack={currentTrack?.id === track.id}
                  isPlaying={isPlaying}
                  track={track}
                  playlistTracks={tracks}
                  onPlayPauseClick={(e) => {
                    e.stopPropagation();
                    if (currentTrack?.id === track.id) {
                      togglePlayPause();
                    } else {
                      playTrack(track, tracks);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
