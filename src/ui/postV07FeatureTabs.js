import { buildExplanationReport } from '../analysis/explanation/index.js';
import { analyzeHigherLevelMetrics } from '../analysis/metrics/index.js';
import { buildAnalysisBundle } from '../analysis/summary/index.js';
import { mountAiExplanation } from './renderAiExplanation.js';
import { mountHigherMetrics } from './renderHigherMetrics.js';
import { mountIntegrationExport } from './renderIntegrationExport.js';

function makeTab(id, label) {
  const tab = document.createElement('button');
  tab.className = 'analysis-tab';
  tab.id = `analysis-tab-${id}`;
  tab.type = 'button';
  tab.setAttribute('role', 'tab');
  tab.setAttribute('aria-selected', 'false');
  tab.setAttribute('aria-controls', `analysis-panel-${id}`);
  tab.dataset.tab = id;
  tab.tabIndex = -1;
  tab.textContent = label;
  return tab;
}

function makePanel(id, eyebrow, title, version, rootAttribute) {
  const panel = document.createElement('section');
  panel.className = 'analysis-tabpanel';
  panel.id = `analysis-panel-${id}`;
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', `analysis-tab-${id}`);
  panel.dataset.tabPanel = id;
  panel.hidden = true;
  panel.innerHTML = `
    <section class="panel" aria-labelledby="${id}-title">
      <div class="panel-heading"><div><p class="eyebrow">${eyebrow}</p><h2 id="${id}-title">${title}</h2></div><span class="status-pill">${version}</span></div>
      <div ${rootAttribute}></div>
    </section>
  `;
  return panel;
}

export function mountPostV07FeatureTabs(tabsRoot, song) {
  if (!tabsRoot) return null;
  const tabList = tabsRoot.querySelector('[role="tablist"]');
  const aiTab = tabsRoot.querySelector('#analysis-tab-ai');
  const aiPanel = tabsRoot.querySelector('#analysis-panel-ai');
  const partsTab = tabsRoot.querySelector('#analysis-tab-parts');
  const partsPanel = tabsRoot.querySelector('#analysis-panel-parts');
  if (!tabList || !aiTab || !aiPanel || !partsTab || !partsPanel) return null;

  let exportTab = tabsRoot.querySelector('#analysis-tab-export');
  let exportPanel = tabsRoot.querySelector('#analysis-panel-export');
  if (!exportTab) {
    exportTab = makeTab('export', 'Export');
    tabList.insertBefore(exportTab, aiTab);
  }
  if (!exportPanel) {
    exportPanel = makePanel('export', 'INTEGRATION / EXPORT', 'Demo Composer・Report書き出し', 'v0.7', 'data-integration-export-root');
    aiPanel.parentNode.insertBefore(exportPanel, aiPanel);
  }

  let metricsTab = tabsRoot.querySelector('#analysis-tab-metrics');
  let metricsPanel = tabsRoot.querySelector('#analysis-panel-metrics');
  if (!metricsTab) {
    metricsTab = makeTab('metrics', 'Metrics');
    tabList.insertBefore(metricsTab, partsTab);
  }
  if (!metricsPanel) {
    metricsPanel = makePanel('metrics', 'HIGHER-LEVEL METRICS', '高度な特徴量', 'v0.9', 'data-higher-metrics-root');
    partsPanel.parentNode.insertBefore(metricsPanel, partsPanel);
  }

  const bundle = buildAnalysisBundle(song);
  const metrics = analyzeHigherLevelMetrics(song, bundle);
  const explanation = buildExplanationReport(song, bundle, metrics);
  const exportController = mountIntegrationExport(exportPanel.querySelector('[data-integration-export-root]'), song, bundle, metrics, explanation);
  const aiController = mountAiExplanation(aiPanel, bundle, explanation);
  const metricsController = mountHigherMetrics(metricsPanel.querySelector('[data-higher-metrics-root]'), metrics);

  return Object.freeze({ bundle, metrics, explanation, exportController, aiController, metricsController });
}
