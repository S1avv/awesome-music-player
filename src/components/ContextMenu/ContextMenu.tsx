import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Home, Upload, RefreshCw } from "lucide-react";

export function ContextMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Prevent default browser/system context menu

      // Check if clicking near the edge to prevent the menu from going off-screen
      const x = e.clientX;
      const y = e.clientY;
      
      const menuWidth = 220;
      const menuHeight = 250;

      const safeX = x + menuWidth > window.innerWidth ? window.innerWidth - menuWidth - 10 : x;
      const safeY = y + menuHeight > window.innerHeight ? window.innerHeight - menuHeight - 10 : y;

      setPosition({ x: safeX, y: safeY });
      setIsOpen(true);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) setIsOpen(false);
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("scroll", handleScroll, { capture: true }); // Close on scroll anywhere

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // React Router v6 uses history.state.idx to track the position in history stack
  const historyState = window.history.state;
  const historyIdx = historyState && typeof historyState.idx === 'number' ? historyState.idx : 0;
  
  const canGoBack = historyIdx > 0;
  const canGoForward = window.history.length > historyIdx + 1 && historyIdx > 0 || (historyIdx === 0 && window.history.length > 1);

  const menuItems = [
    { 
      label: "Go Back", 
      icon: <ArrowLeft className="w-4 h-4" />, 
      action: () => navigate(-1),
      disabled: !canGoBack
    },
    { 
      label: "Go Forward", 
      icon: <ArrowRight className="w-4 h-4" />, 
      action: () => navigate(1),
      disabled: !canGoForward
    },
    { divider: true },
    { label: "Reload App", icon: <RefreshCw className="w-4 h-4" />, action: () => window.location.reload() },
  ];

  return (
    <div 
      ref={menuRef}
      style={{ top: position.y, left: position.x }}
      className="fixed z-[9999] w-56 bg-dark-alt/90 backdrop-blur-xl border border-white/10 rounded-2xl py-2 overflow-hidden animate-fade-in text-sm"
    >
      {menuItems.map((item, index) => {
        if (item.divider) {
          return <div key={`divider-${index}`} className="h-px w-full bg-white/10 my-1.5" />;
        }
        
        return (
          <button
            key={item.label}
            onClick={() => {
              if (item.disabled) return;
              item.action?.();
              setIsOpen(false);
            }}
            disabled={item.disabled}
            className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors group ${
              item.disabled 
                ? "text-light/30 cursor-not-allowed" 
                : "text-light/80 hover:text-light hover:bg-white/10"
            }`}
          >
            <div className={`transition-colors ${item.disabled ? "text-light/30" : "text-light/50 group-hover:text-secondary"}`}>
              {item.icon}
            </div>
            <span className="font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
