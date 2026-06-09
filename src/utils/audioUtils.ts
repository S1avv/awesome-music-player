

export function hasUnsafeChars(path: string): boolean {
  return path.includes('#') || path.includes('?');
}

export let currentBlobUrl: string | null = null;

export function setCurrentBlobUrl(url: string | null) {
  currentBlobUrl = url;
}

export function revokeCurrentBlobUrl() {
  if (currentBlobUrl) {
    URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = null;
  }
}
