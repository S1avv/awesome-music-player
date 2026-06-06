import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Pencil, X } from "lucide-react";
import { useSettings } from "../../hooks/useSettings";
import { useTranslation } from "../../i18n";

interface AvatarSelectorProps {
  className?: string;
}

export function AvatarSelector({ className = "" }: AvatarSelectorProps) {
  const { t } = useTranslation();
  const { userAvatar, setUserAvatar } = useSettings();
  const [isOpen, setIsOpen] = useState(false);

  const availableAvatars = useMemo(() => {
    return [
      "/avatars/1.jpg",
      "/avatars/2.jpg",
      "/avatars/3.jpg",
      "/avatars/4.jpg",
      "/avatars/5.jpg",
      "/avatars/6.jpg",
      "/avatars/7.jpg"
    ];
  }, []);

  return (
    <>
      {/* Avatar Display */}
      <div
        className={`relative group cursor-pointer ${className}`}
        onClick={() => setIsOpen(true)}
      >
        <img
          src={userAvatar}
          alt="User Avatar"
          className="w-full h-full object-cover rounded-full bg-dark-alt border-2 border-white/5"
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
          <Pencil className="w-1/3 h-1/3 text-white" />
        </div>
      </div>

      {/* Modal Selection */}
      {isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in" onClick={() => setIsOpen(false)}>
          <div className="bg-dark-alt border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col relative" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-light">{t.avatar.choose}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-light opacity-50 hover:opacity-100 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {availableAvatars.length === 0 ? (
                <div className="text-center py-12 opacity-50 flex flex-col items-center gap-4">
                  <div className="text-4xl">📁</div>
                  <p>{t.avatar.folderEmpty}</p>
                  <p className="text-sm">{t.avatar.addImages}</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6">
                  {availableAvatars.map(path => (
                    <div
                      key={path}
                      onClick={() => { setUserAvatar(path); setIsOpen(false); }}
                      className={`aspect-square rounded-full cursor-pointer transition-all hover:scale-110 ${userAvatar === path ? 'ring-4 ring-secondary ring-offset-4 ring-offset-dark-alt' : 'opacity-70 hover:opacity-100'}`}
                    >
                      <img src={path} className="w-full h-full object-cover rounded-full" alt="Avatar option" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
