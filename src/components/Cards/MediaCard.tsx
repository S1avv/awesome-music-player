import { Play, Pause } from "lucide-react";
import { Link } from "react-router-dom";
import { TrackCover } from "./TrackCover";
import { TrackMenu } from "../ContextMenu/TrackMenu";
import { Track } from "../../contexts/LibraryContext";

interface MediaCardProps {
  image?: string;
  title: string;
  subtitle: string;
  onClick?: () => void;
  titleHref?: string;
  trackPath?: string;
  isCurrentTrack?: boolean;
  isPlaying?: boolean;
  playCount?: number;
  onPlayPauseClick?: (e: React.MouseEvent) => void;
  track?: Track;
  playlistTracks?: Track[];
}

export function MediaCard({ image = "/PhonographRecord.png", title, subtitle, onClick, titleHref, trackPath, isCurrentTrack, isPlaying, playCount, onPlayPauseClick, track, playlistTracks }: MediaCardProps) {
  return (
    <div 
      className="group flex flex-col gap-3 w-full cursor-pointer snap-start"
      onClick={onClick}
    >
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-dark-alt">
        {trackPath ? (
          <TrackCover path={trackPath} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        )}
        
        {/* Play Button Overlay */}
        <div className={`absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center backdrop-blur-[2px] ${isCurrentTrack ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <button 
            onClick={(e) => {
              if (onPlayPauseClick) {
                e.stopPropagation();
                onPlayPauseClick(e);
              }
            }}
            className={`bg-secondary text-dark p-4 rounded-full transition-all duration-300 hover:scale-110 ${isCurrentTrack ? 'translate-y-0' : 'translate-y-4 group-hover:translate-y-0'}`}
          >
            {isCurrentTrack && isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current" />
            )}
          </button>
        </div>
      </div>
      
      <div className="flex flex-col w-full min-w-0">
        <div className="flex items-center justify-between gap-2 w-full">
          {titleHref ? (
            <Link to={titleHref} onClick={e => e.stopPropagation()} className="text-light font-bold truncate text-base md:text-lg hover:text-secondary transition-colors block flex-1">
              {title}
            </Link>
          ) : (
            <h4 className="text-light font-bold truncate text-base md:text-lg flex-1">{title}</h4>
          )}
          {titleHref && trackPath && track && (
            <div className="flex items-center gap-1">
              <TrackMenu track={track} playlistTracks={playlistTracks} />
            </div>
          )}
        </div>
        <p className="text-light/50 text-sm md:text-base font-medium truncate">{subtitle}</p>
        {playCount !== undefined && (
          <p className="text-secondary/80 text-xs md:text-sm font-medium mt-1">{playCount} plays</p>
        )}
      </div>
    </div>
  );
}
