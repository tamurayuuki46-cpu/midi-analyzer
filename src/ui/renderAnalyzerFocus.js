import './analyzerFocus.css';
import { DIAGNOSTIC_INTENTS, analyzeIntentDiagnostic } from '../analysis/diagnostic/index.js';
import { buildFocusItems, describeAction } from './analyzerFocusModel.js';
import { INTENT_STORAGE_KEY, loadIntentId } from './renderDiagnosticLoop.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function saveIntent(intentId) {
  try {
    globalThis.localStorage?.setItem(INTENT_STORAGE_KEY, JSON.stringify(intentId));
  } catch {
    // Preference only.
  }
}

function songStats(song) {
  const tempo = song?.tempoMap?.[0]?.bpm;
  const meter = song?.timeSignatures?.[0];
  return [
    `${song?.tracks?.length ?? 0} tracks`,
    `${song?.notes?.length ?? 0} notes`,
    Number.isFinite(tempo) ? `${tempo.toFixed(0)} BPM` : null,
    meter ? `${meter.numerator}/${meter.denominator}` : null,
  ].filter(Boolean).join(' · ');
}

function focusCard(item) {
  return `
    <article class="analyzer-focus-card" data-focus-item="${escapeHtml(item.id)}">
      <div class="analyzer-focus-card-head"><span class="analyzer-focus-rank">${item.rank}</span><strong>${escapeHtml(item.title)}</strong></div>
      <dl>
        <div><dt>Evidence</dt><dd>${escapeHtml(item.evidence)}</dd></div>
        <div><dt>Meaning</dt><dd>${escapeHtml(item.meaning)}</dd></div>
        <div><dt>Action</dt><dd>${escapeHtml(describeAction(item))}</dd></div>
      </dl>
    </article>
  `;
}

export function mountAnalyzerFocus(root, song, options = {}) {
  if (!root) return null;
  let intentId = loadIntentId();
  let diagnostic = null;

  function compute() {
    diagnostic = analyzeIntentDiagnostic(song, { intentId, analysisOptions: options.analysisOptions ?? {} });
    return buildFocusItems(diagnostic);
  }

  function render() {
    const items = compute();
    const intent = DIAGNOSTIC_INTENTS.find((entry) => entry.id === intentId) ?? DIAGNOSTIC_INTENTS[0];
    root.innerHTML = `
      <div class="analyzer-focus-head">
        <div><p class="eyebrow">ANALYZER · 今見る3つ</p><h2 id="analyzer-focus-title">${escapeHtml(song?.source?.fileName ?? 'untitled.mid')}</h2><p class="analyzer-focus-stats">${escapeHtml(songStats(song))}</p></div>
        <span class="status-pill">採点しません</span>
      </div>
      <label class="analyzer-focus-intent">
        <span>今回の目的</span>
        <select data-focus-intent>
          ${DIAGNOSTIC_INTENTS.map((entry) => `<option value="${escapeHtml(entry.id)}" ${entry.id === intentId ? 'selected' : ''}>${escapeHtml(entry.label)}</option>`).join('')}
        </select>
        <small>${escapeHtml(intent.description)}</small>
      </label>
      ${items.length
        ? `<div class="analyzer-focus-list" data-focus-list>${items.map(focusCard).join('')}</div>`
        : '<p class="empty-state" data-focus-empty>このMIDIは区間が短い、または情報が少ないため、今見る候補を作れませんでした。下の「詳細モード」から各分析を直接開けます。</p>'}
      <p class="helper-note">目的は並び順にだけ使います。Actionは「元の曲を残して1項目だけ試す」提案で、採用は強制しません。</p>
      <div class="analyzer-focus-actions">
        <button type="button" data-focus-open-detail>詳細分析を開く</button>
        <button type="button" data-focus-open-archive>素材として保存する（Archive）</button>
      </div>
    `;
  }

  root.addEventListener('change', (event) => {
    const select = event.target.closest('[data-focus-intent]');
    if (!select) return;
    intentId = DIAGNOSTIC_INTENTS.some((entry) => entry.id === select.value) ? select.value : 'neutral';
    saveIntent(intentId);
    render();
    // Keep the detailed "目的から分析する" panel in step with this choice.
    const detail = document.querySelector('[data-diagnostic-intent]');
    if (detail && detail.value !== intentId) {
      detail.value = intentId;
      detail.dispatchEvent(new Event('change', { bubbles: true }));
    }
    root.querySelector('[data-focus-intent]')?.focus();
  });

  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-focus-open-detail]')) {
      document.querySelector('[data-analysis-mode="detail"]')?.click();
      document.querySelector('#analysis-tab-structure')?.click();
      document.querySelector('[data-analysis-tabs]')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (event.target.closest('[data-focus-open-archive]')) {
      window.dispatchEvent(new CustomEvent('midi-analyzer-set-view', { detail: { view: 'archive' } }));
    }
  });

  // The detailed panel can also change the intent; follow it.
  const follow = (event) => {
    const select = event.target.closest?.('[data-diagnostic-intent]');
    if (!select || select.value === intentId || !root.isConnected) return;
    intentId = DIAGNOSTIC_INTENTS.some((entry) => entry.id === select.value) ? select.value : intentId;
    render();
  };
  document.addEventListener('change', follow);

  render();
  return Object.freeze({
    getIntentId: () => intentId,
    getItems: () => buildFocusItems(diagnostic),
    destroy: () => document.removeEventListener('change', follow),
  });
}
