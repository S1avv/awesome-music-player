import { useTranslation } from "../../../i18n";
import { Play } from "lucide-react";
import { useLibrary } from "../../../contexts/LibraryContext";
import { useAudio } from "../../../contexts/AudioContext";
import { useNavigate } from "react-router-dom";

export function Banner() {
  const { t } = useTranslation();
  const { tracks } = useLibrary();
  const { playTrack } = useAudio();
  const navigate = useNavigate();
  const isEmpty = tracks.length === 0;

  const handleShuffleAll = () => {
    if (isEmpty) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    playTrack(shuffled[0], shuffled);
  };

  return (
    <div 
      className="relative w-full h-[25rem] md:h-[28rem] rounded-[3rem] overflow-hidden group bg-dark isolate"
      style={{ WebkitMaskImage: '-webkit-radial-gradient(white, black)' }}
    >
      {/* Background Gradient */}
      <div 
        className="absolute inset-0 bg-linear-to-br from-secondary/60 via-secondary/20 to-dark transition-transform duration-700 group-hover:scale-105"
      />
      
      {/* Gradient Overlay for text readability */}
      <div className="absolute inset-0 bg-linear-to-r from-dark/90 via-dark/40 to-transparent mix-blend-multiply" />
      <div className="absolute inset-0 bg-linear-to-t from-dark/80 via-transparent to-transparent" />

      {/* Decorative 3D Model */}
      <div className="absolute -right-12 md:right-0 top-1/2 -translate-y-1/2 w-[80%] sm:w-[60%] lg:w-[50%] h-[140%] pointer-events-none transition-transform duration-700 group-hover:scale-105 group-hover:-translate-x-4 group-hover:-rotate-3 z-0 opacity-90">
        <div className="relative w-full h-full">
          {/* Base Image with dynamic CSS hue rotation for the theme */}
          <img 
            src="/headphones.png" 
            alt="3D Headphones" 
            className="w-full h-full object-contain object-right"
            style={{ filter: 'hue-rotate(var(--model-hue-rotate, 0deg))' }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end w-full md:w-2/3 lg:w-1/2 z-10">
        <div className="animate-fade-in-up">
          <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold tracking-wider text-light mb-4 border border-white/5 uppercase">
            {t.home.localLibrary}
          </span>
          
          <h1 className="text-5xl md:text-6xl font-black text-light mb-2 leading-tight drop-shadow-2xl whitespace-nowrap">
            {t.home.yourMusic}
          </h1>
          <p className="text-xl md:text-2xl text-light/80 font-medium mb-8 drop-shadow-md">
            {t.home.diveIntoCollection}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button 
              disabled={isEmpty}
              onClick={handleShuffleAll}
              className={`bg-secondary text-dark font-bold px-8 py-4 rounded-full flex items-center gap-3 shadow-[0_0_40px_rgba(var(--color-secondary),0.4)] ${isEmpty ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-105 transition-transform'}`}
            >
              <Play className="w-5 h-5 fill-current" />
              {t.home.shuffleAll}
            </button>
            <button 
              onClick={() => navigate('/upload')}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-light border border-white/10 font-bold px-8 py-4 rounded-full flex items-center gap-3 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              {t.home.addTrack}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
