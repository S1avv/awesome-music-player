import { useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../Sidebar/Sidebar";
import { Header } from "../Header/Header";
import { DragRegion } from "../Header/DragRegion";
import { MobileMenu } from "../Sidebar/MobileMenu";
import { PlayerBar } from "../Player/PlayerBar";
import { NowPlaying } from "../Player/NowPlaying";
import { PlayingQueue } from "../Player/PlayingQueue";
import { isMacOsDesktop } from "../../utils/env";
import { useAudio } from "../../contexts/AudioContext";

export function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { currentTrack } = useAudio();

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop <= 10) {
      if (isCollapsed) setIsCollapsed(false);
    } else {
      if (!isCollapsed) setIsCollapsed(true);
    }
  }, [isCollapsed]);

  const showPlayerBar = currentTrack !== null;

  return (
    <div className="flex flex-col w-full h-screen bg-dark text-light font-sans overflow-hidden relative">
      {/* Header section */}
      <DragRegion className={`w-full pt-4 md:pt-8 pr-6 md:pr-8 ${isMacOsDesktop() ? 'pl-8' : 'pl-6 md:pl-8'} shrink-0 relative z-50`}>
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
      </DragRegion>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden mt-6 md:mt-10 px-0 md:px-8 gap-12">
        <div className="hidden md:flex shrink-0 flex-col h-full relative z-40">
          <Sidebar />
        </div>
        <main 
          className="flex-1 flex flex-col h-full overflow-y-auto relative z-0 px-6 md:px-0 pb-32"
          onScroll={handleScroll}
        >
          <Outlet />
        </main>
      </div>

      {showPlayerBar && <PlayerBar isCollapsed={isCollapsed} onExpand={() => setIsCollapsed(false)} />}
      <NowPlaying />
      <PlayingQueue />

      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
    </div>
  );
}
