import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, X, Upload } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { useTranslation } from "../../i18n";

interface CoverSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWebUrl: (url: string) => void;
  onSelectLocalFile: (path: string) => void;
  initialQuery: string;
}

export function CoverSearchModal({ isOpen, onClose, onSelectWebUrl, onSelectLocalFile, initialQuery }: CoverSearchModalProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery, isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=30`);
      const data = await response.json();
      
      const uniqueUrls = new Set<string>();
      data.results.forEach((item: any) => {
        if (item.artworkUrl100) {
          uniqueUrls.add(item.artworkUrl100.replace('100x100bb', '600x600bb'));
        }
      });
      
      setResults(Array.from(uniqueUrls));
    } catch (e) {
      console.error("Search failed:", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocalUpload = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Image', extensions: ['png', 'jpg', 'jpeg'] }]
      });
      if (selected && typeof selected === 'string') {
        onSelectLocalFile(selected);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-dark border border-white/10 rounded-3xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-light flex items-center gap-3">
            {t.trackDetail.chooseCover}
          </h2>
          <button onClick={onClose} className="text-light/50 hover:text-light transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6 overflow-y-auto">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-light/50" />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.trackDetail.searchPlaceholder}
                className="w-full bg-white/5 border border-white/10 text-light pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-secondary transition-colors"
              />
            </div>
            <button 
              type="submit" 
              disabled={isSearching}
              className="bg-secondary text-dark font-bold px-6 py-3 rounded-xl disabled:opacity-50"
            >
              {isSearching ? t.trackDetail.searching : t.trackDetail.searchWeb}
            </button>
          </form>

          {results.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {results.map((url, i) => (
                <div 
                  key={i} 
                  onClick={() => onSelectWebUrl(url)}
                  className="aspect-square rounded-xl overflow-hidden cursor-pointer border border-transparent hover:border-secondary transition-all hover:scale-105"
                >
                  <img src={url} alt="Cover result" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center py-4 border-t border-white/10 mt-2">
            <button 
              type="button"
              onClick={handleLocalUpload}
              className="flex items-center gap-2 text-light/70 hover:text-light transition-colors"
            >
              <Upload className="w-5 h-5" />
              {t.trackDetail.uploadLocal}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
