import { getCurrentWindow } from '@tauri-apps/api/window';

export function useWindowControls() {
  const minimize = () => {
    getCurrentWindow().minimize();
  };

  const toggleMaximize = async () => {
    const isMaximized = await getCurrentWindow().isMaximized();
    if (isMaximized) {
      await getCurrentWindow().unmaximize();
    } else {
      await getCurrentWindow().maximize();
    }
  };

  const close = () => {
    getCurrentWindow().close();
  };

  return { minimize, toggleMaximize, close };
}
