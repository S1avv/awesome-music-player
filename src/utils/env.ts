export const isTauri = () => {
  return typeof window !== 'undefined' && ('__TAURI__' in window || '__TAURI_INTERNALS__' in window);
};

export const isWindowsDesktop = () => {
  return isTauri() && window.navigator.userAgent.toLowerCase().includes("win");
};
