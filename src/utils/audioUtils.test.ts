import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hasUnsafeChars, currentBlobUrl, setCurrentBlobUrl, revokeCurrentBlobUrl } from './audioUtils';

describe('audioUtils', () => {
  describe('hasUnsafeChars', () => {
    it('returns true for paths with #', () => {
      expect(hasUnsafeChars('path/to/#file')).toBe(true);
    });

    it('returns true for paths with ?', () => {
      expect(hasUnsafeChars('path/to/?file')).toBe(true);
    });

    it('returns false for safe paths', () => {
      expect(hasUnsafeChars('path/to/file')).toBe(false);
    });
  });

  describe('blob URL management', () => {
    beforeEach(() => {
      window.URL.revokeObjectURL = vi.fn();
      setCurrentBlobUrl(null);
    });

    it('sets and gets the current blob URL', () => {
      setCurrentBlobUrl('blob:http://localhost/123');
      expect(currentBlobUrl).toBe('blob:http://localhost/123');
    });

    it('revokes the current blob URL if it exists', () => {
      setCurrentBlobUrl('blob:http://localhost/123');
      revokeCurrentBlobUrl();
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/123');
      expect(currentBlobUrl).toBeNull();
    });

    it('does not revoke if no blob URL exists', () => {
      setCurrentBlobUrl(null);
      revokeCurrentBlobUrl();
      expect(window.URL.revokeObjectURL).not.toHaveBeenCalled();
    });
  });
});
