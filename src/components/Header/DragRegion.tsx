import { ReactNode } from "react";
import { getCurrentWindow } from '@tauri-apps/api/window';
import { isTauri } from "../../utils/env";

interface DragRegionProps {
  children: ReactNode;
  className?: string;
}

export function DragRegion({ children, className = "" }: DragRegionProps) {
  const startDrag = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    
    // Do not drag if clicking an element marked as non-draggable
    if (target.closest('[data-tauri-drag-region="false"]')) {
      return;
    }

    // Do not drag if clicking standard interactive elements just in case
    if (target.closest('button') || target.closest('input')) {
      return;
    }

    if (isTauri() && e.buttons === 1) {
      try {
        getCurrentWindow().startDragging();
      } catch (err) {}
    }
  };

  return (
    <div 
      className={className} 
      onPointerDown={startDrag}
      data-tauri-drag-region
    >
      {children}
    </div>
  );
}
