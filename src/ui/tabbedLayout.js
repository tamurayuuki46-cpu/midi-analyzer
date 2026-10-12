import './tabbedLayout.css';

export const ANALYSIS_TABS = Object.freeze([
  'overview',
  'harmony',
  'melody',
  'bass',
  'rhythm',
  'structure',
  'compare',
  'library',
  'ai',
  'parts',
]);

export function getTabIndexForKey(currentIndex, key, count) {
  if (!Number.isInteger(currentIndex) || !Number.isInteger(count) || count <= 0) return currentIndex;
  if (key === 'ArrowRight') return (currentIndex + 1) % count;
  if (key === 'ArrowLeft') return (currentIndex - 1 + count) % count;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  return currentIndex;
}

export function mountAnalysisTabs(root, initialTab = 'overview') {
  if (!root) return null;
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = [...root.querySelectorAll('[role="tabpanel"]')];
  if (!tabs.length || !panels.length) return null;

  function activate(tabId, { focus = false } = {}) {
    const target = tabs.find((tab) => tab.dataset.tab === tabId) ?? tabs[0];
    const nextId = target.dataset.tab;

    tabs.forEach((tab) => {
      const selected = tab === target;
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.tabIndex = selected ? 0 : -1;
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.tabPanel !== nextId;
    });
    if (focus) target.focus();
    return nextId;
  }

  root.addEventListener('click', (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (!tab || !root.contains(tab)) return;
    activate(tab.dataset.tab);
  });

  root.addEventListener('keydown', (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (!tab) return;
    const currentIndex = tabs.indexOf(tab);
    const nextIndex = getTabIndexForKey(currentIndex, event.key, tabs.length);
    if (nextIndex === currentIndex && !['Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    activate(tabs[nextIndex].dataset.tab, { focus: true });
  });

  const activeTab = ANALYSIS_TABS.includes(initialTab) ? initialTab : 'overview';
  activate(activeTab);
  return Object.freeze({ activate, getActive: () => tabs.find((tab) => tab.getAttribute('aria-selected') === 'true')?.dataset.tab ?? null });
}
