import './advancedAnalysis.css';
import { analyzeHarmonyDetails } from '../analysis/harmony/index.js';
import { analyzeMotifs } from '../analysis/motif/index.js';
import { analyzeStructure } from '../analysis/structure/index.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderMotifs(result) {
  if (!result.motifs.length) return `<p class="empty-state">${escapeHtml(result.note)}</p>`;
  return `
    <div class="advanced-card-list">
      ${result.motifs.slice(0, 5).map((motif, index) => `
        <article class="advanced-card">
          <div class="advanced-card-heading">
            <strong>Motif ${index + 1}</strong>
            <span class="status-pill">${motif.occurrenceCount}回</span>
          </div>
          <p>${motif.noteLength} notes · 代表Pitch ${motif.representativePitches.join('–')}</p>
          <small>開始: ${motif.occurrences.map((item) => `${Math.round(item.startTick)} tick`).join(' / ')}</small>
        </article>
      `).join('')}
    </div>
  `;
}

function renderSections(result) {
  if (!result.sections.length) return '<p class="empty-state">Section候補はありません。</p>';
  return `
    <div class="advanced-section-grid">
      ${result.sections.map((section) => `
        <article class="advanced-card">
          <div class="advanced-card-heading">
            <strong>Section ${escapeHtml(section.label)}</strong>
            <span class="status-pill">${section.startBar}–${section.endBar}小節</span>
          </div>
          <p>密度 ${section.metrics.density} / quarter · 平均Pitch ${section.metrics.averagePitch}</p>
          <small>類似度 ${(section.similarity * 100).toFixed(0)}% · ${section.metrics.noteCount} notes</small>
        </article>
      `).join('')}
    </div>
  `;
}

function relationLabel(relation) {
  const labels = {
    parallel: '同主調',
    relative: '平行調',
    dominant: '属調方向',
    subdominant: '下属調方向',
    semitone: '半音移動',
    'whole-tone': '全音移動',
    other: 'その他',
  };
  return labels[relation] ?? relation;
}

function renderKeyTimeline(result) {
  return `
    <div class="advanced-key-timeline">
      ${result.keyTimeline.map((entry) => `
        <article class="advanced-key-chip">
          <small>${entry.startBar}–${entry.endBar}小節</small>
          <strong>${escapeHtml(entry.effective?.value ?? '—')}</strong>
          <span>${entry.effective ? `${(entry.effective.confidence * 100).toFixed(0)}%` : '候補なし'}</span>
        </article>
      `).join('')}
    </div>
    ${result.modulations.length ? `
      <div class="advanced-card-list">
        ${result.modulations.map((item) => `
          <article class="advanced-card">
            <div class="advanced-card-heading">
              <strong>${item.atBar}小節付近 · 転調候補</strong>
              <span class="status-pill">${escapeHtml(relationLabel(item.relation))}</span>
            </div>
            <p>${escapeHtml(item.from)} → ${escapeHtml(item.to)}</p>
            <small>区間一致度の低い側 ${(item.confidence * 100).toFixed(0)}%</small>
          </article>
        `).join('')}
      </div>
    ` : '<p class="helper-note">隣接区間でKey候補が切り替わる箇所は見つかりませんでした。</p>'}
  `;
}

function renderHarmony(result) {
  const detailed = result.segments.filter((segment) => segment.inversion || segment.extensions?.length);
  const segments = detailed.length ? detailed : result.segments.slice(0, 6);
  if (!segments.length) return '<p class="empty-state">Chord Detail候補はありません。</p>';
  return `
    <div class="advanced-card-list">
      ${segments.slice(0, 12).map((segment) => `
        <article class="advanced-card">
          <div class="advanced-card-heading">
            <strong>${escapeHtml(segment.displayValue ?? segment.baseCandidate?.value ?? '—')}</strong>
            <span class="status-pill">${segment.barNumber}小節</span>
          </div>
          <p>${segment.inversion ? `Slash Chord候補 · Bass ${escapeHtml(segment.inversion.name)}` : 'Root position候補'}</p>
          <small>${segment.extensions?.length ? `色付け候補: ${segment.extensions.map((item) => item.label).join(' / ')}` : '追加テンション候補なし'}</small>
        </article>
      `).join('')}
    </div>
  `;
}

export function mountAdvancedAnalysis(root, song, options = {}) {
  if (!root) return null;
  const section = options.section ?? 'all';
  const motif = section === 'all' || section === 'structure' ? analyzeMotifs(song) : null;
  const structure = section === 'all' || section === 'structure' ? analyzeStructure(song) : null;
  const harmony = section === 'all' || section === 'harmony' ? analyzeHarmonyDetails(song) : null;
  const blocks = [];

  if (section === 'all' || section === 'structure') {
    blocks.push(`
      <section class="advanced-subsection">
        <div class="advanced-subheading"><h3>Motif候補</h3><span class="status-pill">反復</span></div>
        ${renderMotifs(motif)}
        <p class="helper-note">${escapeHtml(motif.note)}</p>
      </section>
      <section class="advanced-subsection">
        <div class="advanced-subheading"><h3>Section候補</h3><span class="status-pill">4小節単位</span></div>
        ${renderSections(structure)}
      </section>
      <section class="advanced-subsection">
        <div class="advanced-subheading"><h3>区間Key / 転調候補</h3><span class="status-pill">Timeline</span></div>
        ${renderKeyTimeline(structure)}
      </section>
    `);
  }

  if (section === 'all' || section === 'harmony') {
    blocks.push(`
      <section class="advanced-subsection">
        <div class="advanced-subheading"><h3>Chord Detail</h3><span class="status-pill">Slash / Tension</span></div>
        ${renderHarmony(harmony)}
        <p class="helper-note">${escapeHtml(harmony.note)}</p>
      </section>
    `);
  }

  root.innerHTML = `<div class="advanced-analysis-stack">${blocks.join('')}</div>`;
  return Object.freeze({ motif, structure, harmony });
}
