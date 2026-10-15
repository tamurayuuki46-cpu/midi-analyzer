import {
  analyzeDiagnosticLoop,
  buildArrangementLabHandoff,
} from '../analysis/diagnostic/index.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function percent(value) {
  return Number.isFinite(value) ? `${Math.round(value * 100)}%` : '—';
}

function safeFileName(value) {
  return String(value || 'midi')
    .replace(/\.(mid|midi)$/i, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'midi';
}

function renderSectionComparison(result) {
  const comparison = result?.sectionComparison;
  if (!comparison?.sections?.length) return '<p class="empty-state">Section比較に必要な区間候補がありません。</p>';
  return `
    <div class="advanced-section-grid" data-diagnostic-sections>
      ${comparison.sections.map((section) => `
        <article class="advanced-card">
          <div class="advanced-card-heading">
            <strong>Section ${escapeHtml(section.label)}</strong>
            <span class="status-pill">${section.startBar}–${section.endBar}小節</span>
          </div>
          <p>Note密度 ${section.density ?? '—'} / quarter · Melody音域 ${section.melodyRangeSemitones ?? '—'} st</p>
          <small>Chord Tone ${percent(section.chordToneRatio)} · 着地 ${escapeHtml(section.landingPitchName ?? '—')} (${escapeHtml(section.landingDegree ?? '—')})</small>
        </article>
      `).join('')}
    </div>
    ${comparison.adjacent?.length ? `
      <div class="advanced-card-list">
        ${comparison.adjacent.map((item) => `
          <article class="advanced-card">
            <div class="advanced-card-heading"><strong>${escapeHtml(item.fromLabel)} → ${escapeHtml(item.toLabel)}</strong><span class="status-pill">差分</span></div>
            <p>${escapeHtml(item.meaning)}</p>
          </article>
        `).join('')}
      </div>
    ` : ''}
    <p class="helper-note">${escapeHtml(comparison.note)}</p>
  `;
}

function renderMetricMeanings(result) {
  const items = result?.metricMeanings ?? [];
  if (!items.length) return '<p class="empty-state">意味付けできる分析値が不足しています。</p>';
  return `
    <div class="advanced-card-list" data-diagnostic-meanings>
      ${items.map((item) => `
        <article class="advanced-card">
          <div class="advanced-card-heading"><strong>${escapeHtml(item.title)}</strong><span class="status-pill">Meaning</span></div>
          <p>${escapeHtml(item.meaning)}</p>
          <small>${escapeHtml(item.evidence)}</small>
        </article>
      `).join('')}
    </div>
  `;
}

function renderPriorities(result) {
  const items = result?.priorities ?? [];
  if (!items.length) return '<p class="empty-state">見直し候補を作れるEvidenceが不足しています。</p>';
  return `
    <div class="advanced-card-list" data-diagnostic-priorities>
      ${items.map((item) => `
        <article class="advanced-card">
          <div class="advanced-card-heading"><strong>${item.priority}. ${escapeHtml(item.title)}</strong><span class="status-pill">Try</span></div>
          <p>${escapeHtml(item.meaning)}</p>
          <small>${escapeHtml(item.evidence)}<br>${escapeHtml(item.action)}</small>
        </article>
      `).join('')}
    </div>
    <p class="helper-note">${escapeHtml(result.note)}</p>
  `;
}

function downloadJson(payload, fileName) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function transferHandoff(root, handoff, fileName, options = {}) {
  if (typeof options.onArrangementHandoff === 'function') {
    await options.onArrangementHandoff(handoff);
    return 'Arrangement Lab連携先へ提案を渡しました。';
  }

  root.dispatchEvent(new CustomEvent('midi-analyzer:arrangement-handoff', {
    bubbles: true,
    detail: handoff,
  }));

  const file = typeof File === 'function'
    ? new File([JSON.stringify(handoff, null, 2)], fileName, { type: 'application/json' })
    : null;
  if (file && navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Arrangement Lab 提案', text: 'MIDI Analyzerの見直し候補です。' });
    return '共有メニューへArrangement Lab用提案を渡しました。';
  }

  downloadJson(handoff, fileName);
  return 'Arrangement Lab用JSONを書き出しました。';
}

export function mountDiagnosticLoop(root, song, options = {}) {
  if (!root) return null;
  const diagnostic = analyzeDiagnosticLoop(song, options.analysisOptions ?? {});
  let status = '';

  function render() {
    root.innerHTML = `
      <section class="advanced-subsection">
        <div class="advanced-subheading"><h3>Section比較</h3><span class="status-pill">v0.24</span></div>
        ${renderSectionComparison(diagnostic)}
      </section>
      <section class="advanced-subsection">
        <div class="advanced-subheading"><h3>分析値の意味</h3><span class="status-pill">Explain</span></div>
        ${renderMetricMeanings(diagnostic)}
      </section>
      <section class="advanced-subsection">
        <div class="advanced-subheading"><h3>見直し候補 TOP 3</h3><span class="status-pill">Next action</span></div>
        ${renderPriorities(diagnostic)}
        <button type="button" class="primary-button" data-arrangement-handoff>Arrangement Labへ渡す</button>
        ${status ? `<p class="storage-status" data-diagnostic-status>${escapeHtml(status)}</p>` : ''}
      </section>
    `;
  }

  root.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-arrangement-handoff]');
    if (!button) return;
    button.disabled = true;
    status = 'Arrangement Lab用提案を準備中…';
    render();
    try {
      const handoff = buildArrangementLabHandoff(song, diagnostic);
      const fileName = `${safeFileName(song?.source?.fileName)}_arrangement_handoff_v0.24.json`;
      status = await transferHandoff(root, handoff, fileName, options);
    } catch (error) {
      status = `提案を渡せませんでした: ${error.message}`;
    }
    render();
  });

  render();
  return Object.freeze({
    diagnostic,
    getHandoff: () => buildArrangementLabHandoff(song, diagnostic),
  });
}
