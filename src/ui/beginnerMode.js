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

function list(items) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function metricCard(metric) {
  const actions = metric.actions?.length
    ? `<div class="metric-actions"><span>Action</span>${list(metric.actions)}</div>`
    : '';
  return `
    <article class="beginner-metric-card" data-beginner-metric="${escapeHtml(metric.id)}">
      <span class="metric-kicker">Metric</span>
      <strong>${escapeHtml(metric.label)}: ${escapeHtml(metric.value)}</strong>
      <small>${escapeHtml(metric.detail)}</small>
      <div class="metric-meaning"><span>Meaning</span><p>${escapeHtml(metric.meaning)}</p></div>
      ${actions}
    </article>
  `;
}

function referenceCard(item) {
  return `
    <article class="reference-insight-card" data-reference-insight="${escapeHtml(item.id)}">
      <strong>${escapeHtml(item.label)}</strong>
      <p><span>Trait</span>${escapeHtml(item.trait)}</p>
      <p><span>自分の曲で試す</span>${escapeHtml(item.action)}</p>
    </article>
  `;
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
        <p>数値を採点せず、「Metric → Meaning → Action」の順で特徴を読みます。Actionは選ばなくても構いません。</p>
      </div>
      <span class="status-pill">端末内分析</span>
    </div>
    <div class="beginner-mode-switch" role="group" aria-label="解析表示モード">
      <button type="button" data-analysis-mode="beginner">初心者モード</button>
      <button type="button" data-analysis-mode="detail">詳細モード</button>
    </div>
    <div class="beginner-content" data-beginner-content>
      <div class="beginner-step"><span>1</span><div><strong>特徴を基本5項目＋音の役割に整理</strong><p>外音・広い音域・跳躍などを良い / 悪いで判定せず、曲の性格として読みます。Chord ToneとScale Toneも別々に確認します。</p></div></div>
      <div class="beginner-metric-grid">${summary.metrics.map(metricCard).join('')}</div>
      <section class="beginner-next-card" aria-labelledby="beginner-next-title">
        <p class="eyebrow">OPTIONAL ACTIONS</p>
        <h3 id="beginner-next-title">次に試せること</h3>
        <ol>${summary.nextActions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
        <p>どれも提案です。今の特徴をそのまま残す、今日は決めない、でも構いません。</p>
      </section>
      <section class="reference-insights" aria-labelledby="reference-insights-title">
        <p class="eyebrow">REFERENCE → ACTION</p>
        <h3 id="reference-insights-title">参考曲から借りるのは音符ではなく考え方</h3>
        <p>具体的なNote列やChord列をコピーせず、音域・動き・発音位置・反復の傾向として自分の曲で試します。</p>
        <div class="reference-insight-grid">${summary.referenceInsights.map(referenceCard).join('')}</div>
      </section>
      <p class="beginner-disclaimer">これは曲の良し悪しを採点する機能ではありません。Metricは特徴量、Meaningは読み方、Actionは任意の実験案です。MIDIや解析結果を外部へ自動送信しません。</p>
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
