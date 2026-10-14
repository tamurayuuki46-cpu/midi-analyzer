import './beginnerMode.css';
import { buildBeginnerSummary } from '../analysis/beginner/index.js';

const MODE_KEY = 'midi-analyzer.analysis-mode.v1';
const BEGINNER = 'beginner';
const DETAIL = 'detail';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function readMode() {
  try {
    return globalThis.localStorage?.getItem(MODE_KEY) === DETAIL ? DETAIL : BEGINNER;
  } catch {
    return BEGINNER;
  }
}

function saveMode(mode) {
  try {
    globalThis.localStorage?.setItem(MODE_KEY, mode);
  } catch {
    // Storage preference is optional. Analysis itself must keep working.
  }
}

function metricCard(metric) {
  return `
    <article class="beginner-metric-card" data-beginner-metric="${escapeHtml(metric.id)}">
      <span>${escapeHtml(metric.label)}</span>
      <strong>${escapeHtml(metric.value)}</strong>
      <small>${escapeHtml(metric.detail)}</small>
    </article>
  `;
}

function list(items) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

export function mountBeginnerMode(root, song, options = {}) {
  const tabsRoot = root?.querySelector('[data-analysis-tabs]');
  if (!root || !tabsRoot) return null;

  const summary = buildBeginnerSummary(song, options);
  const panel = document.createElement('section');
  panel.className = 'panel beginner-mode-panel';
  panel.setAttribute('aria-labelledby', 'beginner-mode-title');
  panel.innerHTML = `
    <div class="beginner-mode-heading">
      <div>
        <p class="eyebrow">ANALYSIS MODE</p>
        <h2 id="beginner-mode-title">初心者モード</h2>
        <p>むずかしい数値を先に追わず、まず「特徴 → 良いところ → 改善候補 → 次に試すこと」の順で見ます。</p>
      </div>
      <span class="status-pill">端末内分析</span>
    </div>
    <div class="beginner-mode-switch" role="group" aria-label="解析表示モード">
      <button type="button" data-analysis-mode="beginner">初心者モード</button>
      <button type="button" data-analysis-mode="detail">詳細モード</button>
    </div>
    <div class="beginner-content" data-beginner-content>
      <div class="beginner-step"><span>1</span><div><strong>MIDIを読み込みました</strong><p>自動分析した結果を、まず5項目だけにまとめます。</p></div></div>
      <div class="beginner-metric-grid">${summary.metrics.map(metricCard).join('')}</div>
      <div class="beginner-feedback-grid">
        <section class="beginner-feedback-card is-positive" aria-labelledby="beginner-good-title">
          <h3 id="beginner-good-title">良いところ</h3>
          ${list(summary.positives)}
        </section>
        <section class="beginner-feedback-card" aria-labelledby="beginner-improve-title">
          <h3 id="beginner-improve-title">改善するとよいところ</h3>
          ${list(summary.improvements)}
        </section>
      </div>
      <section class="beginner-next-card" aria-labelledby="beginner-next-title">
        <p class="eyebrow">NEXT 1–3</p>
        <h3 id="beginner-next-title">次に試すこと</h3>
        <ol>${summary.nextActions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
      </section>
      <p class="beginner-disclaimer">これは曲の良し悪しを採点する機能ではありません。既存Analyzerの候補値を、初心者向けの言葉に言い換えています。MIDIや解析結果を外部へ自動送信しません。</p>
    </div>
    <p class="beginner-detail-note" data-detail-note hidden>詳細モードでは、従来の全解析タブをそのまま使えます。初心者モードへ戻しても解析結果は失われません。</p>
  `;
  tabsRoot.before(panel);

  const beginnerContent = panel.querySelector('[data-beginner-content]');
  const detailNote = panel.querySelector('[data-detail-note]');
  const buttons = [...panel.querySelectorAll('[data-analysis-mode]')];
  let mode = readMode();

  function applyMode(nextMode, { persist = true } = {}) {
    mode = nextMode === DETAIL ? DETAIL : BEGINNER;
    const beginnerActive = mode === BEGINNER;
    beginnerContent.hidden = !beginnerActive;
    detailNote.hidden = beginnerActive;
    tabsRoot.hidden = beginnerActive;
    buttons.forEach((button) => {
      const active = button.dataset.analysisMode === mode;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.classList.toggle('is-active', active);
    });
    if (persist) saveMode(mode);
    panel.dispatchEvent(new CustomEvent('analysis-mode-change', { detail: { mode } }));
  }

  panel.addEventListener('click', (event) => {
    const button = event.target.closest('[data-analysis-mode]');
    if (!button) return;
    applyMode(button.dataset.analysisMode);
  });

  applyMode(mode, { persist: false });
  return Object.freeze({
    getMode: () => mode,
    setMode: (nextMode) => applyMode(nextMode),
    summary,
  });
}
