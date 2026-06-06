import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

interface TrackCoverProps {
  path?: string;
  className?: string;
  defaultImage?: string;
  alt?: string;
}

export function TrackCover({ path, className = "w-full h-full object-cover", defaultImage = "/PhonographRecord.png", alt = "Cover" }: TrackCoverProps) {
  const [cover, setCover] = useState(defaultImage);

  useEffect(() => {
    setCover(defaultImage);

    if (path) {
      let isMounted = true;
      invoke<string | null>("get_track_cover", { path })
        .then(res => {
          if (isMounted && res) setCover(res);
        })
        .catch(() => { });

      return () => { isMounted = false; };
    }
  }, [path, defaultImage]);

  return <img src={cover} className={className} alt={alt} />;
}
