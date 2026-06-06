import { createContext, useState, useEffect, ReactNode } from "react";

interface Settings {
  uiScale: number;
  theme: string;
  audioQuality: string;
  language: string;
  userName: string;
  userPlan: string;
  userEmail: string;
  isFirstRun: boolean;
  libraryPath: string;
  userAvatar: string;
}

interface SettingsContextType extends Settings {
  setUiScale: (scale: number) => void;
  setTheme: (theme: string) => void;
  setAudioQuality: (quality: string) => void;
  setLanguage: (lang: string) => void;
  setUserName: (name: string) => void;
  setUserPlan: (plan: string) => void;
  setUserEmail: (email: string) => void;
  setIsFirstRun: (val: boolean) => void;
  setLibraryPath: (path: string) => void;
  setUserAvatar: (path: string) => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = "mucis_settings";

const DEFAULT_SETTINGS: Settings = {
  uiScale: 1.0,
  theme: "dark",
  audioQuality: "high",
  language: "en",
  userName: "",
  userPlan: "Premium Plan",
  userEmail: "",
  isFirstRun: true,
  libraryPath: "",
  userAvatar: "/avatars/1.jpg"
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error("Failed to parse settings", e);
    }
    return DEFAULT_SETTINGS;
  });

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {}
  };

  useEffect(() => {
    const baseFontSize = 16;
    document.documentElement.style.fontSize = `${baseFontSize * settings.uiScale}px`;
  }, [settings.uiScale]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
  }, [settings.theme]);

  return (
    <SettingsContext.Provider value={{ 
      ...settings, 
      setUiScale: (v) => updateSetting("uiScale", v),
      setTheme: (v) => updateSetting("theme", v),
      setAudioQuality: (v) => updateSetting("audioQuality", v),
      setLanguage: (v) => updateSetting("language", v),
      setUserName: (v) => updateSetting("userName", v),
      setUserPlan: (v) => updateSetting("userPlan", v),
      setUserEmail: (v) => updateSetting("userEmail", v),
      setIsFirstRun: (v) => updateSetting("isFirstRun", v),
      setLibraryPath: (v) => updateSetting("libraryPath", v),
      setUserAvatar: (v) => updateSetting("userAvatar", v)
    }}>
      {children}
    </SettingsContext.Provider>
  );
}
