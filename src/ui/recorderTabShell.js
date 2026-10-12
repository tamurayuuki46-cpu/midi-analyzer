import { mountPartRecorder } from './renderPartRecorder.js';

export function mountRecorderTab(tabsRoot, song) {
  if (!tabsRoot) return null;
  const tabList = tabsRoot.querySelector('[role="tablist"]');
  const aiTab = tabsRoot.querySelector('#analysis-tab-ai');
  const aiPanel = tabsRoot.querySelector('#analysis-panel-ai');
  if (!tabList || !aiTab || !aiPanel) return null;

  let tab = tabsRoot.querySelector('#analysis-tab-recorder');
  let panel = tabsRoot.querySelector('#analysis-panel-recorder');

  if (!tab) {
    tab = document.createElement('button');
    tab.className = 'analysis-tab';
    tab.id = 'analysis-tab-recorder';
    tab.type = 'button';
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', 'false');
    tab.setAttribute('aria-controls', 'analysis-panel-recorder');
    tab.dataset.tab = 'recorder';
    tab.tabIndex = -1;
    tab.textContent = 'Recorder';
    tabList.insertBefore(tab, aiTab);
  }

  if (!panel) {
    panel = document.createElement('section');
    panel.className = 'analysis-tabpanel';
    panel.id = 'analysis-panel-recorder';
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', 'analysis-tab-recorder');
    panel.dataset.tabPanel = 'recorder';
    panel.hidden = true;
    panel.innerHTML = `
      <section class="panel" aria-labelledby="recorder-title">
        <div class="panel-heading"><div><p class="eyebrow">SEPARATE RECORDING</p><h2 id="recorder-title">パート分離録音</h2></div><span class="status-pill">v0.7</span></div>
        <div data-part-recorder-root></div>
      </section>
    `;
    aiPanel.parentNode.insertBefore(panel, aiPanel);
  }

  return mountPartRecorder(panel.querySelector('[data-part-recorder-root]'), song);
}
