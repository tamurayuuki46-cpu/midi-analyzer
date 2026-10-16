import './appViews.css';
import {
  APP_VIEW_STORAGE_KEY,
  defaultSaveForView,
  normalizeAppView,
  resolveInitialView,
  viewFromHash,
} from './appViewModel.js';

function readStoredView() {
  try {
    return globalThis.localStorage?.getItem(APP_VIEW_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

function storeView(view) {
  try {
    globalThis.localStorage?.setItem(APP_VIEW_STORAGE_KEY, view);
  } catch {
    // Preference only. Both views must keep working without localStorage.
  }
}

export function mountAppViews() {
  const nav = document.querySelector('[data-app-view-switch]');
  if (!nav) return null;
  const buttons = [...nav.querySelectorAll('[data-app-view-button]')];
  const saveCheckbox = document.querySelector('#save-midi');
  let current = null;

  function apply(view, { syncHash = true, persist = true, resetSaveDefault = true } = {}) {
    const next = normalizeAppView(view);
    const changed = next !== current;
    current = next;
    document.body.dataset.appView = next;
    buttons.forEach((button) => {
      const active = button.dataset.appViewButton === next;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.classList.toggle('is-active', active);
    });
    if (persist) storeView(next);
    if (syncHash && viewFromHash(globalThis.location?.hash) !== next) {
      // A hash entry lets the Android back button return to the previous view.
      globalThis.location.hash = next;
    }
    if (changed && resetSaveDefault && saveCheckbox && !saveCheckbox.disabled) {
      saveCheckbox.checked = defaultSaveForView(next);
    }
    if (changed) {
      window.dispatchEvent(new CustomEvent('midi-analyzer-view-change', { detail: { view: next } }));
      window.scrollTo?.({ top: 0 });
    }
    return next;
  }

  nav.addEventListener('click', (event) => {
    const button = event.target.closest('[data-app-view-button]');
    if (!button || !nav.contains(button)) return;
    apply(button.dataset.appViewButton);
  });

  window.addEventListener('hashchange', () => {
    // Back to a hash-less entry means the default view.
    const fromHash = viewFromHash(globalThis.location.hash) ?? normalizeAppView(null);
    if (fromHash !== current) apply(fromHash, { syncHash: false });
  });

  // Other modules ask for a view change through an event so they do not import each other.
  window.addEventListener('midi-analyzer-set-view', (event) => {
    apply(event.detail?.view);
  });

  const initial = resolveInitialView({ hash: globalThis.location?.hash, stored: readStoredView() });
  // First paint: keep the saved-OFF default of the import form unless we start in Archive.
  apply(initial, { syncHash: false, persist: false, resetSaveDefault: true });
  if (!viewFromHash(globalThis.location?.hash)) {
    // Record the starting view without adding a history entry, so Back can return to it.
    try {
      globalThis.history?.replaceState(globalThis.history.state, '', `#${initial}`);
    } catch {
      // Hash is a convenience only.
    }
  }
  return Object.freeze({ getView: () => current, setView: (view) => apply(view) });
}
