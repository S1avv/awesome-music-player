import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  QueueListIcon,
  UserIcon,
  UserGroupIcon,
  PowerIcon,
  ArrowUpTrayIcon
} from "@heroicons/react/24/solid";
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useTranslation } from "../../i18n";

export function Sidebar() {
  const { t } = useTranslation();

  const TOP_NAV_ITEMS = [
    { name: t.nav.home, path: "/", icon: HomeIcon },
    { name: t.nav.playlist, path: "/playlist", icon: QueueListIcon },
    { name: t.nav.artists, path: "/artists", icon: UserGroupIcon },
    { name: t.nav.upload, path: "/upload", icon: ArrowUpTrayIcon },
  ];
  return (
    <aside className="flex flex-col gap-8 w-[4.5rem] shrink-0 items-center">
      
      {/* Top Group - 4 Buttons */}
      <nav className="flex flex-col items-center py-6 gap-6 bg-dark-alt rounded-full w-full">
        {TOP_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `group relative w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${
                  isActive 
                    ? "text-secondary drop-shadow-[0_0_12px_currentColor]" 
                    : "text-light opacity-25 hover:opacity-100 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-6 h-6" />
                  {/* Tooltip */}
                  {!isActive && (
                    <div className="absolute left-[calc(100%+16px)] px-4 py-2 bg-dark-alt border border-white/5 text-light text-sm font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-0 delay-0 group-hover:duration-300 group-hover:delay-[100ms] whitespace-nowrap z-50 pointer-events-none">
                      {item.name}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Group - 2 Buttons */}
      <nav className="flex flex-col items-center py-6 gap-6 bg-dark-alt rounded-full w-full">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `group relative w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 ${
              isActive 
                ? "text-secondary drop-shadow-[0_0_12px_currentColor]" 
                : "text-light opacity-25 hover:opacity-100 hover:text-white"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <UserIcon className="w-6 h-6" />
              {!isActive && (
                <div className="absolute left-[calc(100%+16px)] px-4 py-2 bg-dark-alt border border-white/5 text-light text-sm font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-0 delay-0 group-hover:duration-300 group-hover:delay-[100ms] whitespace-nowrap z-50 pointer-events-none">
                  {t.nav.profile}
                </div>
              )}
            </>
          )}
        </NavLink>
        
        <button 
          onClick={() => getCurrentWindow().close()}
          className="group relative w-12 h-12 flex items-center justify-center rounded-full text-red-500 opacity-50 hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all duration-300 cursor-pointer"
        >
          <PowerIcon className="w-6 h-6" />
          <div className="absolute left-[calc(100%+16px)] px-4 py-2 bg-dark-alt border border-white/5 text-light text-sm font-medium rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-0 delay-0 group-hover:duration-300 group-hover:delay-[100ms] whitespace-nowrap z-50 pointer-events-none">
            {t.nav.exitApp}
          </div>
        </button>
      </nav>

    </aside>
  );
}
