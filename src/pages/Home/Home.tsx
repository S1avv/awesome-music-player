import { Banner } from "./components/Banner";
import { TrendingSection } from "./components/TrendingSection";
import { ArtistsSection } from "./components/ArtistsSection";
import { TopChartsSection } from "./components/TopChartsSection";
import { useLibrary } from "../../contexts/LibraryContext";
import { useSettings } from "../../hooks/useSettings";
import { FolderSearch } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { useTranslation } from "../../i18n";

export function Home() {
  const { tracks } = useLibrary();
  const { setLibraryPath } = useSettings();
  const { t } = useTranslation();

  const handleSelectFolder = async () => {
    const p = await open({ directory: true });
    if (p) setLibraryPath(p as string);
  };
  return (
    <div className="w-full min-h-full flex flex-col gap-12 pb-12">
      {/* Top Section: Banner + Top Charts */}
      <div className="flex flex-col xl:flex-row gap-8 w-full">
        <div className="flex-1 min-w-0">
          <Banner />
        </div>
        <TopChartsSection />
      </div>
      
      {tracks.length > 0 ? (
        <div className="flex flex-col gap-12 px-2 md:px-0">
          <TrendingSection />
          <ArtistsSection />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center bg-dark-alt rounded-[2rem] border border-white/5 mx-2 md:mx-0 animate-fade-in">
          <h2 className="text-2xl font-bold text-light mb-3">{t.home.emptyStateTitle}</h2>
          <p className="text-light/50 max-w-md mb-8 leading-relaxed">
            {t.home.emptyStateDesc}
          </p>
          <button 
            onClick={handleSelectFolder}
            className="bg-secondary text-dark font-bold px-8 py-4 rounded-full flex items-center gap-3 hover:scale-105 transition-transform"
          >
            <FolderSearch className="w-5 h-5" />
            {t.home.selectFolder}
          </button>
        </div>
      )}
    </div>
  );
}
