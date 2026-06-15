import { useState, useRef, useEffect, useMemo } from "react";
import { useSettings } from "../../hooks/useSettings";
import { useTranslation } from "../../i18n";
import { Pencil, Check, FolderOpen } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { AvatarSelector } from "../../components/AvatarSelector/AvatarSelector";
import { FlagIcon } from "../../components/FlagIcon/FlagIcon";
import { useLibrary } from "../../contexts/LibraryContext";

interface CustomSelectProps {
  label: string;
  description: string;
  options: { label: string; value: any; icon?: React.ReactNode }[];
  value: any;
  onChange: (val: any) => void;
}

function CustomSelect({ label, description, options, value, onChange }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(o => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col gap-3 relative" ref={containerRef}>
      <label className="text-light font-medium opacity-80">{label}</label>
      <div 
        className="w-full bg-dark text-light border border-white/5 rounded-xl px-6 py-4 flex items-center justify-between cursor-pointer hover:border-white/10 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          {selectedOption.icon}
          <span className="font-medium">{selectedOption.label}</span>
        </div>
        <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>
      
      {isOpen && (
        <div className="absolute top-[85px] left-0 w-full bg-dark border border-white/10 rounded-xl overflow-hidden z-50 py-2">
          {options.map(opt => (
            <div 
              key={opt.label} 
              className={`px-6 py-3 cursor-pointer hover:bg-white/5 transition-colors flex items-center gap-3 ${opt.value === value ? 'text-secondary bg-white/5' : 'text-light'}`}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
            >
              {opt.icon}
              {opt.label}
            </div>
          ))}
        </div>
      )}
      <p className="text-sm text-light opacity-40">{description}</p>
    </div>
  );
}

function EditableField({ 
  value, 
  onSave, 
  className, 
  maxLength = 40,
  editable = true 
}: { 
  value: string, 
  onSave: (v: string) => void, 
  className?: string,
  maxLength?: number,
  editable?: boolean
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    onSave(tempValue);
    setIsEditing(false);
  };

  if (!editable) {
    return <span className={className}>{value}</span>;
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-3">
        <input 
          autoFocus
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          maxLength={maxLength}
          className={`bg-dark border border-white/10 rounded-lg px-3 py-1 outline-none focus:border-secondary/50 text-light w-full max-w-[250px] ${className}`}
        />
        <button onClick={handleSave} className="p-2 hover:bg-white/10 rounded-full transition-colors text-secondary shrink-0 cursor-pointer">
          <Check className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 group w-fit">
      <span className={className}>{value}</span>
      <button 
        onClick={() => setIsEditing(true)} 
        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-full transition-all text-light shrink-0 cursor-pointer"
      >
        <Pencil className="w-4 h-4 opacity-50 hover:opacity-100" />
      </button>
    </div>
  );
}

export function Profile() {
  const { 
    uiScale, setUiScale,
    theme, setTheme,
    audioQuality, setAudioQuality,
    language, setLanguage,
    userName, setUserName,
    userPlan, setUserPlan,
    userEmail, setUserEmail,
    libraryPath, setLibraryPath
  } = useSettings();
  
  const { t } = useTranslation();
  const { tracks, diskSpace, playlists } = useLibrary();

  const activityStats = useMemo(() => {
    let totalSeconds = 0;
    const artistCounts = new Map<string, number>();

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      
      // Calculate total listening time based on track duration and actual play count
      // If duration is missing, estimate as 3 minutes
      const trackDuration = track.duration || 180;
      totalSeconds += trackDuration * (track.play_count || 0);
      
      // Count artists for Top Artist
      const artist = track.artist || "Unknown Artist";
      artistCounts.set(artist, (artistCounts.get(artist) || 0) + 1);
    }

    // Find Top Artist
    let topArtist = t.common.none || "None";
    let maxCount = 0;
    for (const [artist, count] of artistCounts.entries()) {
      if (count > maxCount && artist !== "Unknown Artist") {
        maxCount = count;
        topArtist = artist;
      }
    }

    // Calculate total hours
    const totalHours = (totalSeconds / 3600).toFixed(1);

    // Calculate Playlists
    const playlistsCount = playlists.length > 0 ? playlists.length - 1 : 0;

    return {
      totalHours,
      playlistsCount,
      topArtist
    };
  }, [tracks, playlists.length, t.common.none, t.home.unknownArtist]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const usedSpaceStr = diskSpace ? formatBytes(diskSpace.used_space) : "0 GB";
  const totalSpaceStr = diskSpace ? formatBytes(diskSpace.total_space) : "0 GB";
  const diskPercentage = diskSpace ? Math.round((diskSpace.used_space / diskSpace.total_space) * 100) : 0;

  const SIZES = [
    { label: t.options.sizes.verySmall, value: 0.6 },
    { label: t.options.sizes.small, value: 0.8 },
    { label: t.options.sizes.default, value: 1.0 },
    { label: t.options.sizes.large, value: 1.2 },
  ];

  const THEMES = [
    { label: t.options.themes.dark, value: "dark" },
    { label: t.options.themes.light, value: "light" },
    { label: t.options.themes.midnight, value: "midnight" },
    { label: t.options.themes.spotify, value: "spotify" },
    { label: t.options.themes.sunset, value: "sunset" },
    { label: t.options.themes.cyberpunk, value: "cyberpunk" },
    { label: t.options.themes.coffee, value: "coffee" },
  ];

  const AUDIO_QUALITIES = [
    { label: t.options.audio.standard, value: "standard" },
    { label: t.options.audio.high, value: "high" },
    { label: t.options.audio.lossless, value: "lossless" },
  ];

  const LANGUAGES = [
    { label: t.options.lang.en, value: "en", icon: <FlagIcon lang="en" className="w-5 h-5 shrink-0" /> },
    { label: t.options.lang.ru, value: "ru", icon: <FlagIcon lang="ru" className="w-5 h-5 shrink-0" /> },
    { label: t.options.lang.es, value: "es", icon: <FlagIcon lang="es" className="w-5 h-5 shrink-0" /> },
    { label: t.options.lang.de, value: "de", icon: <FlagIcon lang="de" className="w-5 h-5 shrink-0" /> },
    { label: t.options.lang.fr, value: "fr", icon: <FlagIcon lang="fr" className="w-5 h-5 shrink-0" /> },
    { label: t.options.lang.uk, value: "uk", icon: <FlagIcon lang="uk" className="w-5 h-5 shrink-0" /> },
    { label: t.options.lang.zh, value: "zh", icon: <FlagIcon lang="zh" className="w-5 h-5 shrink-0" /> },
    { label: t.options.lang.ja, value: "ja", icon: <FlagIcon lang="ja" className="w-5 h-5 shrink-0" /> },
  ];

  return (
    <div className="w-full xl:h-full min-h-[min-content] pb-12 flex flex-col xl:flex-row gap-10 xl:items-stretch">
      
      {/* Left Column: Main Settings */}
      <div className="flex-1 flex flex-col gap-10 xl:h-full">
        
        {/* Account Block */}
        <section className="bg-dark-alt p-8 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center gap-8">
          <AvatarSelector className="w-[100px] h-[100px] shrink-0" />
          <div className="flex flex-col gap-1 w-full max-w-md">
            <EditableField 
              value={userName} 
              onSave={setUserName} 
              className="text-3xl font-bold text-light" 
              maxLength={20}
            />
            <EditableField 
              value={userPlan} 
              onSave={setUserPlan} 
              className="text-secondary font-medium text-lg" 
              editable={false}
            />
            <EditableField 
              value={userEmail} 
              onSave={setUserEmail} 
              className="text-light opacity-40 mt-1" 
              maxLength={30}
            />
          </div>
        </section>

        {/* Preferences Block */}
        <section className="bg-dark-alt p-8 rounded-[2rem] flex flex-col gap-10 xl:flex-1">
          <div>
            <h2 className="text-2xl font-bold text-light mb-2">{t.profile.preferences}</h2>
            <p className="text-light opacity-50 font-medium">
              {t.profile.preferencesDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <CustomSelect 
              label={t.profile.interfaceSize}
              description={t.profile.interfaceSizeDesc}
              options={SIZES}
              value={uiScale}
              onChange={setUiScale}
            />
            <CustomSelect 
              label={t.profile.theme}
              description={t.profile.themeDesc}
              options={THEMES}
              value={theme}
              onChange={setTheme}
            />
            <CustomSelect 
              label={t.profile.audioQuality}
              description={t.profile.audioQualityDesc}
              options={AUDIO_QUALITIES}
              value={audioQuality}
              onChange={setAudioQuality}
            />
            <CustomSelect 
              label={t.profile.language}
              description={t.profile.languageDesc}
              options={LANGUAGES}
              value={language}
              onChange={setLanguage}
            />
          </div>
        </section>
      </div>

      {/* Right Column: Extras (Adaptive) */}
      <div className="w-full xl:w-[350px] shrink-0 flex flex-col gap-10 xl:h-full">
        
        {/* Statistics */}
        <section className="bg-dark-alt p-8 rounded-[2rem] flex flex-col gap-6">
          <h3 className="text-xl font-bold text-light">{t.profile.yourActivity}</h3>
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <span className="text-light opacity-60">{t.profile.totalHours}</span>
            <span className="text-light font-bold text-lg">{activityStats.totalHours}</span>
          </div>
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <span className="text-light opacity-60">{t.profile.playlists}</span>
            <span className="text-light font-bold text-lg">{activityStats.playlistsCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-light opacity-60">{t.profile.topArtist}</span>
            <span className="text-secondary font-bold text-lg truncate max-w-[150px] text-right" title={activityStats.topArtist}>
              {activityStats.topArtist}
            </span>
          </div>
        </section>

        {/* Local Storage */}
        <section className="bg-dark-alt p-8 rounded-[2rem] flex flex-col gap-6 xl:flex-1">
          <h3 className="text-xl font-bold text-light">{t.profile.localStorage}</h3>
          
          <div className="flex flex-col gap-4 mt-2 border-b border-white/5 pb-6">
            <div>
              <p className="text-light opacity-60 text-sm mb-2">{t.profile.libraryFolder}</p>
              <div className="flex items-center gap-3 w-full">
                <button 
                  onClick={async () => {
                    const p = await open({ directory: true });
                    if (p) setLibraryPath(p as string);
                  }}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-secondary cursor-pointer shrink-0"
                >
                  <FolderOpen className="w-5 h-5" />
                </button>
                <div className="flex-1 truncate bg-dark px-4 py-3 rounded-xl border border-white/5 text-sm text-light opacity-80" title={libraryPath || t.onboarding?.noFolderSelected}>
                  {libraryPath || "..."}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-light opacity-60">{t.profile.usedSpace}</span>
              <span className="text-light font-bold">{usedSpaceStr} / {totalSpaceStr}</span>
            </div>
            <div className="w-full h-2 bg-dark rounded-full overflow-hidden">
              <div 
                className="h-full bg-secondary rounded-full transition-all duration-1000"
                style={{ width: `${diskPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-auto pt-4">
            <div className="w-12 h-12 bg-dark rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-light opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
            </div>
            <div>
              <p className="text-light font-bold text-lg">{t.profile.offlineLibrary}</p>
              <p className="text-secondary text-sm font-medium">{tracks.length.toLocaleString()} {t.profile.tracks}</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
