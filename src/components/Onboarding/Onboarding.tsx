import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useSettings } from "../../hooks/useSettings";
import { useTranslation } from "../../i18n";
import { DragRegion } from "../Header/DragRegion";
import { WindowControls } from "../Header/WindowControls";
import { FlagIcon } from "../FlagIcon/FlagIcon";
import { Wand2 } from "lucide-react";

export function Onboarding() {
  const { t, lang } = useTranslation();
  const { 
    setLanguage, 
    userName, setUserName,
    userEmail, setUserEmail,
    libraryPath, setLibraryPath,
    setIsFirstRun 
  } = useSettings();
  
  const [step, setStep] = useState(1);
  const [isLangOpen, setIsLangOpen] = useState(false);

  const generateRandomName = () => {
    const names = [
      "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Sam", "Jamie", "Neon", "Cyber",
      "Max", "Leo", "Nova", "Luna", "Kai", "Axel", "Zane", "Eli", "Jude",
      "Quinn", "Rowan", "Sage", "River", "Skyler", "Finn", "Milo", "Theo", "Ezra", "Levi"
    ];
    const name = names[Math.floor(Math.random() * names.length)];
    const num = Math.floor(Math.random() * 9000) + 1000;
    return `${name}${num}`;
  };

  const generateRandomEmail = (baseName: string) => {
    const prefix = baseName ? baseName.toLowerCase().replace(/[^a-z0-9]/g, '') : generateRandomName().toLowerCase();
    const randomChars = Math.random().toString(36).substring(2, 7);
    const domains = [
      "awesome-music-player.com", 
      "awesome-music-player.io", 
      "awesome-music-player.net"
    ];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    return `${prefix}.${randomChars}@${domain}`;
  };

  const handleGenerateName = () => {
    setUserName(generateRandomName());
  };

  const handleGenerateEmail = () => {
    setUserEmail(generateRandomEmail(userName));
  };

  useEffect(() => {
    if (!userName && !userEmail) {
      const newName = generateRandomName();
      setUserName(newName);
      setUserEmail(generateRandomEmail(newName));
    }
  }, []);

  const handleNext = () => setStep(s => Math.min(2, s + 1));
  const handleBack = () => setStep(s => Math.max(1, s - 1));
  
  const handleSelectFolder = async () => {
    try {
      const selectedPath = await open({
        directory: true,
        multiple: false,
      });
      if (selectedPath) {
        setLibraryPath(selectedPath as string);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFinish = () => {
    setIsFirstRun(false);
  };

  return (
    <div className="fixed inset-0 z-[999] bg-dark flex flex-col text-light">
      <DragRegion className="w-full flex items-center justify-between px-6 py-4 relative">
        <div className="flex items-center gap-2">
          <img className="w-[50px]" src="image.png"></img>
        </div>
        
        {/* Step Indicators */}
        <div className="absolute left-1/2 -translate-x-1/2 flex gap-3 pointer-events-none">
          {[1, 2].map(i => (
            <div 
              key={i} 
              className={`w-3 h-3 rounded-full transition-all ${step === i ? 'bg-secondary w-8' : 'bg-white/20'}`} 
            />
          ))}
        </div>

        {/* Language Selector + Window Controls */}
        <div className="flex items-center justify-end gap-6 pointer-events-auto w-[150px]">
          <div className="relative">
            <button onClick={() => setIsLangOpen(!isLangOpen)} className="flex items-center gap-2 p-2 hover:bg-white/5 rounded-xl cursor-pointer transition-colors">
              <FlagIcon lang={lang} />
              <svg className={`w-4 h-4 opacity-50 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isLangOpen && (
              <div className="absolute top-full right-0 mt-2 bg-dark-alt border border-white/10 rounded-xl overflow-hidden flex flex-col z-50">
                {(["en", "ru", "es", "de", "fr", "uk", "zh", "ja"] as const).map(l => (
                  <button
                    key={l} 
                    onClick={() => { setLanguage(l); setIsLangOpen(false); }} 
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer min-w-[120px] transition-colors ${lang === l ? 'bg-white/5 text-secondary' : 'text-light'}`}
                  >
                    <FlagIcon lang={l} />
                    <span className="uppercase text-sm font-bold">{l}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <WindowControls />
        </div>
      </DragRegion>

      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl mx-auto w-full">
        {step === 1 && (
          <div className="flex flex-col items-center text-center w-full max-w-sm animate-fade-in">
            <h2 className="text-3xl font-bold mb-2">{t.onboarding.step2Title}</h2>
            <p className="opacity-60 mb-8">{t.onboarding.step2Desc}</p>

            <div className="relative w-full mb-4">
              <input 
                type="text"
                placeholder={t.onboarding.namePlaceholder}
                value={userName}
                onChange={e => setUserName(e.target.value)}
                className="w-full bg-dark-alt border border-white/10 rounded-xl px-6 py-4 outline-none focus:border-secondary transition-colors text-light pr-14"
              />
              <button 
                onClick={handleGenerateName}
                title="Generate Random Name"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary opacity-50 hover:opacity-100 transition-opacity cursor-pointer p-1"
              >
                <Wand2 className="w-5 h-5" />
              </button>
            </div>

            <div className="relative w-full mb-12">
              <input 
                type="email"
                placeholder={t.onboarding.emailPlaceholder}
                value={userEmail}
                onChange={e => setUserEmail(e.target.value)}
                className="w-full bg-dark-alt border border-white/10 rounded-xl px-6 py-4 outline-none focus:border-secondary transition-colors text-light pr-14"
              />
              <button 
                onClick={handleGenerateEmail}
                title="Generate Random Email"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary opacity-50 hover:opacity-100 transition-opacity cursor-pointer p-1"
              >
                <Wand2 className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-4 w-full">
              <button 
                onClick={handleNext}
                disabled={!userName.trim()}
                className="flex-1 px-6 py-4 bg-secondary text-dark font-bold rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
              >
                {t.onboarding.next}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center text-center w-full max-w-sm animate-fade-in">
            <h2 className="text-3xl font-bold mb-2">{t.onboarding.step3Title}</h2>
            <p className="opacity-60 mb-8">{t.onboarding.step3Desc}</p>
            
            <div className="w-full bg-dark-alt border border-white/10 rounded-xl p-6 mb-12 flex flex-col items-center gap-4">
              <button 
                onClick={handleSelectFolder}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors font-medium cursor-pointer"
              >
                {t.onboarding.selectFolderBtn}
              </button>
              <div className="text-sm">
                <span className="opacity-50 mr-2">{libraryPath ? t.onboarding.folderSelected : t.onboarding.noFolderSelected}</span>
                {libraryPath && <span className="text-secondary break-all">{libraryPath}</span>}
              </div>
            </div>

            <div className="flex gap-4 w-full">
              <button 
                onClick={handleBack}
                className="flex-1 px-6 py-4 bg-white/5 font-bold rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                {t.onboarding.back}
              </button>
              <button 
                onClick={handleFinish}
                className="flex-1 px-6 py-4 bg-secondary text-dark font-bold rounded-xl hover:scale-105 transition-transform cursor-pointer"
              >
                {t.onboarding.finish}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
