import { Play } from "lucide-react";
import { TrackCover } from "./TrackCover";

interface ArtistCardProps {
  image?: string;
  name: string;
  trackPath?: string;
  onClick?: () => void;
}

export function ArtistCard({ image = "/artist.jpg", name, trackPath, onClick }: ArtistCardProps) {
  return (
    <div 
      className="group flex flex-col items-center gap-4 min-w-[140px] max-w-[160px] md:min-w-[180px] md:max-w-[200px] cursor-pointer snap-start"
      onClick={onClick}
    >
      <div className="relative aspect-square w-full rounded-full overflow-hidden bg-dark-alt">
        {trackPath ? (
          <TrackCover path={trackPath} defaultImage={image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <img 
            src={image} 
            alt={name} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
          <button className="bg-secondary text-dark p-4 rounded-full translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-110">
            <Play className="w-6 h-6 fill-current" />
          </button>
        </div>
      </div>
      
      <h4 className="text-light font-bold truncate w-full text-center text-base md:text-lg">{name}</h4>
    </div>
  );
}
