import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async (cmd, args) => {
    console.log(`[Mocked Tauri] invoke: ${cmd}`, args);
    if (cmd === 'get_track_cover') return '/mock-cover.jpg';
    if (cmd === 'get_library_tracks') return [];
    return null;
  }),
}));

// Mock window.matchMedia if used by components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
