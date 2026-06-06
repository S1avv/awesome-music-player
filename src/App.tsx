import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout/Layout";
import { Home } from "./pages/Home/Home";
import { Playlist } from "./pages/Playlist/Playlist";
import { PlaylistDetail } from "./pages/PlaylistDetail/PlaylistDetail";
import { TrackDetail } from "./pages/TrackDetail/TrackDetail";
import { Artists } from "./pages/Artists/Artists";
import { ArtistDetail } from "./pages/ArtistDetail/ArtistDetail";
import { Upload } from "./pages/Upload/Upload";
import { Onboarding } from "./components/Onboarding/Onboarding";
import { ContextMenu } from "./components/ContextMenu/ContextMenu";
import { getCurrentWindow } from '@tauri-apps/api/window';
import { restoreStateCurrent, StateFlags } from '@tauri-apps/plugin-window-state';
import { useSettings } from "./hooks/useSettings";
import { isTauri } from "./utils/env";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "./i18n";
import "./App.css";
import { Profile } from "./pages/Profile/Profile";

function App() {
  const { isFirstRun } = useSettings();
  const { t, lang } = useTranslation();

  useEffect(() => {
    if (isTauri()) {
      restoreStateCurrent(StateFlags.ALL).then(() => {
        getCurrentWindow().show();
      }).catch((err) => {
        console.error("Failed to restore window state:", err);
        getCurrentWindow().show();
      });
    }
  }, []);

  useEffect(() => {
    if (isTauri()) {
      invoke('update_tray_menu', {
        playPause: t.tray.playPause,
        next: t.tray.nextTrack,
        prev: t.tray.prevTrack,
        show: t.tray.showApp,
        quit: t.tray.quit
      }).catch(console.error);
    }
  }, [lang, t]);

  return (
    <>
      {isFirstRun && <Onboarding />}
      <BrowserRouter>
        <ContextMenu />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="playlist" element={<Playlist />} />
            <Route path="playlist/:id" element={<PlaylistDetail />} />
            <Route path="track/:id" element={<TrackDetail />} />
            <Route path="artists" element={<Artists />} />
            <Route path="artist/:name" element={<ArtistDetail />} />
            <Route path="upload" element={<Upload />} />
            <Route path="profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
