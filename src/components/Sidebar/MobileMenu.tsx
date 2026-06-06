import { NavLink } from "react-router-dom";
import { 
  HomeIcon, 
  QueueListIcon, 
  FilmIcon, 
  UserIcon, 
  UserGroupIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/solid";
import { useTranslation } from "../../i18n";


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
