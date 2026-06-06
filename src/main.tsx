import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./App.css";
import App from "./App.tsx";
import { SettingsProvider } from "./contexts/SettingsContext.tsx";
import { LibraryProvider } from "./contexts/LibraryContext.tsx";
import { AudioProvider } from "./contexts/AudioContext.tsx";
import { NotificationProvider } from "./contexts/NotificationContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <NotificationProvider>
      <SettingsProvider>
        <LibraryProvider>
          <AudioProvider>
            <App />
          </AudioProvider>
        </LibraryProvider>
      </SettingsProvider>
    </NotificationProvider>
  </StrictMode>
);
