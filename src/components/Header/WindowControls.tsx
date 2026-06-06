import { useEffect, useState } from "react";
import { MinusIcon, Square2StackIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useWindowControls } from "../../hooks/useWindowControls";
import { isWindowsDesktop } from "../../utils/env";

export function WindowControls() {
  const [isWindows, setIsWindows] = useState(false);
  const { minimize, toggleMaximize, close } = useWindowControls();

  useEffect(() => {
    setIsWindows(isWindowsDesktop());
  }, []);

  if (!isWindows) return null;

  return (
    <div className="flex items-center gap-8 pr-2" data-tauri-drag-region="false">
      <button 
        onClick={minimize}
        className="flex items-center justify-center text-light opacity-30 hover:opacity-100 transition-all cursor-pointer bg-transparent border-none"
      >
        <MinusIcon className="w-[22px] h-[22px] stroke-1 pointer-events-none" />
      </button>
      <button 
        onClick={toggleMaximize}
        className="flex items-center justify-center text-light opacity-30 hover:opacity-100 transition-all cursor-pointer bg-transparent border-none"
      >
        <Square2StackIcon className="w-5 h-5 stroke-1 pointer-events-none" />
      </button>
      <button 
        onClick={close}
        className="flex items-center justify-center text-light opacity-30 hover:opacity-100 hover:text-red-400 transition-all cursor-pointer bg-transparent border-none"
      >
        <XMarkIcon className="w-6 h-6 stroke-1 pointer-events-none" />
      </button>
    </div>
  );
}
