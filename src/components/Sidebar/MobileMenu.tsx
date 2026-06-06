import { NavLink } from "react-router-dom";
import { 
  HomeIcon, 
  QueueListIcon, 
  FilmIcon, 
  UserIcon, 
  UserGroupIcon,
  ArrowRightOnRectangleIcon, 
  XMarkIcon 
} from "@heroicons/react/24/solid";
import { useTranslation } from "../../i18n";

function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="w-8 h-8 pointer-events-none">
      <g strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Yellow Note */}
        <path d="M8 14v-7l7-2v6" stroke="#FACD66" />
        <circle cx="6" cy="14" r="2.5" fill="#FACD66" stroke="#FACD66" />
        <circle cx="13" cy="12" r="2.5" fill="#FACD66" stroke="#FACD66" />
        
        {/* Teal Note */}
        <path d="M14 17v-8l6-1.5v7" stroke="#A4C7C6" />
        <circle cx="12" cy="17" r="2.5" fill="#A4C7C6" stroke="#A4C7C6" />
        <circle cx="18" cy="15.5" r="2.5" fill="#A4C7C6" stroke="#A4C7C6" />
      </g>
    </svg>
  );
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { t } = useTranslation();

  const NAV_ITEMS = [
    { name: t.nav.home, path: "/", icon: HomeIcon },
    { name: t.nav.myCollections, path: "/playlist", icon: QueueListIcon },
    { name: t.nav.artists, path: "/artists", icon: UserGroupIcon },
    { name: t.nav.musicVideos, path: "/videos", icon: FilmIcon },
    { name: t.nav.profile, path: "/profile", icon: UserIcon },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[999] md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar Drawer */}
      <div 
        className={`fixed top-0 left-0 h-full w-[280px] bg-dark-alt z-[1000] md:hidden transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >

        <nav className="flex flex-col gap-1 px-4 mt-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${
                    isActive 
                      ? "text-light font-bold bg-white/5" 
                      : "text-light opacity-50 hover:opacity-100 hover:bg-white/5 font-medium"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-6 h-6 ${isActive ? 'text-secondary' : 'text-light opacity-50'}`} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-auto p-4 mb-4">
          <button className="flex items-center gap-4 px-4 py-3 rounded-2xl transition-all text-light opacity-50 hover:opacity-100 hover:bg-white/5 font-medium w-full text-left cursor-pointer">
            <ArrowRightOnRectangleIcon className="w-6 h-6" />
            <span>{t.nav.logOut}</span>
          </button>
        </div>
      </div>
    </>
  );
}
