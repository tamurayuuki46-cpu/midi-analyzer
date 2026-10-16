// Analyzer / Archive view model. Pure functions only (no DOM) so it can be unit tested.
// Both views live in the same PWA, the same Origin and the same IndexedDB.

export const APP_VIEWS = Object.freeze(['analyzer', 'archive']);
export const DEFAULT_APP_VIEW = 'analyzer';
export const APP_VIEW_STORAGE_KEY = 'midi-analyzer.app-view.v1';

export function normalizeAppView(value) {
  return APP_VIEWS.includes(value) ? value : DEFAULT_APP_VIEW;
}

export function viewFromHash(hash) {
  const match = /^#(analyzer|archive)$/.exec(String(hash ?? ''));
  return match ? match[1] : null;
}

export function resolveInitialView({ hash = '', stored = null } = {}) {
  return viewFromHash(hash) ?? normalizeAppView(stored);
}

// The shared import form keeps "save to this device" OFF for Analyzer (look only)
// and ON for Archive (the whole point of Archive is keeping material).
export function defaultSaveForView(view) {
  return normalizeAppView(view) === 'archive';
}
