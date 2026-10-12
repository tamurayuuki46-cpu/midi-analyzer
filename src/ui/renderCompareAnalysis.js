import './compareAnalysis.css';
import { analyzePersonalTrend, compareSongs } from '../analysis/compare/index.js';
import { importMidiFile } from '../midi/index.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function value(value, suffix = '') {
  return Number.isFinite(value) ? `${value}${suffix}` : '—';
}

function percent(value) {
  return Number.isFinite(value) ? `${Math.round(value * 100)}%` : '—';
}

function delta(value, suffix = '') {
  if (!Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}${suffix}`;
}

function renderMetric(label, metric, format = value, suffix = '') {
  return `
    <article class="compare-metric-card">
      <span>${escapeHtml(label)}</span>
      <div class="compare-metric-values">
        <div><small>参考</small><strong>${escapeHtml(format(metric.reference, suffix))}</strong></div>
        <div><small>自作</small><strong>${escapeHtml(format(metric.own, suffix))}</strong></div>
      </div>
      <small>差 ${escapeHtml(delta(metric.delta, suffix))}</small>
    </article>
  `;
}

function renderComparison(result) {
  if (!result) return '<p class="empty-state">比較するMIDIを選ぶと、現在のMIDIと並べて表示します。</p>';
  const m = result.metrics;
  const referenceProgression = result.reference.chordProgression.slice(0, 12).join(' → ') || '—';
  const ownProgression = result.own.chordProgression.slice(0, 12).join(' → ') || '—';

  return `
    <div class="compare-summary-grid">
      <article class="compare-song-card">
        <span>参考曲</span>
        <strong>${escapeHtml(result.reference.name)}</strong>
        <small>Key ${escapeHtml(result.reference.key ?? '—')} · ${value(result.reference.bpm, ' BPM')}</small>
        <p>${escapeHtml(referenceProgression)}</p>
      </article>
      <article class="compare-song-card">
        <span>自作曲</span>
        <strong>${escapeHtml(result.own.name)}</strong>
        <small>Key ${escapeHtml(result.own.key ?? '—')} · ${value(result.own.bpm, ' BPM')}</small>
        <p>${escapeHtml(ownProgression)}</p>
      </article>
    </div>
    <div class="compare-highlight-row">
      <span class="status-pill">Top Key ${result.sameTopKey ? '同じ' : '異なる'}</span>
      <span class="status-pill">Chord共通度 ${percent(result.chordSimilarity)}</span>
    </div>
    <div class="compare-metric-grid">
      ${renderMetric('Melody音域', m.melodyRange, value, ' st')}
      ${renderMetric('Melody密度', m.melodyDensity)}
      ${renderMetric('平均跳躍', m.melodyAverageLeap, value, ' st')}
      ${renderMetric('Bass移動', m.bassAverageMovement, value, ' st')}
      ${renderMetric('Bass Root率', m.bassRootRatio, percent)}
      ${renderMetric('Rhythm密度', m.rhythmOnsetsPerQuarter)}
      ${renderMetric('拍頭率', m.rhythmOnBeatRatio, percent)}
      ${renderMetric('全体Note密度', m.noteDensity)}
      ${renderMetric('転調候補数', m.modulationCount)}
    </div>
    <p class="helper-note">${escapeHtml(result.note)}</p>
  `;
}

function renderTrend(result) {
  if (!result || !result.count || !result.trend) {
    return `<p class="empty-state">${escapeHtml(result?.note ?? '保存済みMIDIから傾向を読み込みます。')}</p>`;
  }
  const trend = result.trend;
  return `
    <div class="compare-trend-grid">
      <article><span>集計曲数</span><strong>${result.count}</strong></article>
      <article><span>よく使うKey</span><strong>${escapeHtml(trend.commonKey?.value ?? '—')}</strong><small>${trend.commonKey ? `${trend.commonKey.count}曲` : ''}</small></article>
      <article><span>平均BPM</span><strong>${value(trend.averageBpm)}</strong></article>
      <article><span>平均Melody音域</span><strong>${value(trend.averageMelodyRange, ' st')}</strong></article>
      <article><span>平均Melody密度</span><strong>${value(trend.averageMelodyDensity)}</strong></article>
      <article><span>平均Bass移動</span><strong>${value(trend.averageBassMovement, ' st')}</strong></article>
      <article><span>平均Rhythm密度</span><strong>${value(trend.averageRhythmDensity)}</strong></article>
      <article><span>平均転調候補</span><strong>${value(trend.averageModulations)}</strong></article>
      <article><span>よく出るChord</span><strong>${escapeHtml(trend.commonChord?.value ?? '—')}</strong><small>${trend.commonChord ? `${trend.commonChord.count}曲` : ''}</small></article>
    </div>
    <p class="helper-note">${escapeHtml(result.note)}</p>
  `;
}

export function mountCompareAnalysis(root, currentSong, options = {}) {
  if (!root) return null;
  let comparison = null;
  let compareStatus = '';
  let trend = null;

  function render() {
    root.innerHTML = `
      <div class="compare-analysis-stack">
        <section class="compare-subsection">
          <div class="compare-heading"><h3>参考曲 vs 現在のMIDI</h3><span class="status-pill">2 MIDI</span></div>
          <label class="compare-file-field">
            <span>参考曲MIDI</span>
            <input type="file" accept=".mid,.midi,audio/midi,audio/x-midi" data-compare-file>
            <small>この比較用MIDIは自動保存しません。</small>
          </label>
          ${compareStatus ? `<p class="compare-status">${escapeHtml(compareStatus)}</p>` : ''}
          ${renderComparison(comparison)}
        </section>
        <section class="compare-subsection">
          <div class="compare-heading"><h3>自分の作曲傾向</h3><span class="status-pill">保存済みMIDI</span></div>
          ${renderTrend(trend)}
        </section>
      </div>
    `;
  }

  root.addEventListener('change', async (event) => {
    const input = event.target.closest('[data-compare-file]');
    if (!input) return;
    const file = input.files?.[0];
    if (!file) return;
    compareStatus = '比較用MIDIを解析中…';
    render();
    try {
      const imported = await importMidiFile(file, { origin: 'midi' });
      comparison = compareSongs(imported.song, currentSong);
      compareStatus = '比較完了';
    } catch (error) {
      comparison = null;
      compareStatus = `比較できませんでした: ${error.message}`;
    }
    render();
  });

  render();

  Promise.resolve(options.loadSavedSongs?.())
    .then((songs) => {
      trend = analyzePersonalTrend(Array.isArray(songs) ? songs : []);
      render();
    })
    .catch((error) => {
      trend = Object.freeze({ count: 0, trend: null, note: `保存済みMIDIの傾向を読めませんでした: ${error.message}` });
      render();
    });

  return Object.freeze({
    getComparison: () => comparison,
    getTrend: () => trend,
  });
}
