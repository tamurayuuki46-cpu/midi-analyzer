import './advancedAnalysis.css';
import { analyzeHarmonyDetails } from '../analysis/harmony/index.js';
import { analyzeSongInsights } from '../analysis/insight/index.js';
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

function renderContour(insight) {
  const contour = insight?.contour;
  if (!contour || !contour.noteCount) return '<p class="empty-state">Phrase contourを分析できるMelody Noteがありません。</p>';
  const climaxPosition = Math.round((contour.climaxCandidate?.positionRatio ?? 0) * 100);
  return `
    <div class="advanced-card-list">
      <article class="advanced-card">
        <div class="advanced-card-heading"><strong>Contour ${escapeHtml(contour.shape)}</strong><span class="status-pill">${contour.directionChanges} turns</span></div>
        <p>音域 ${contour.rangeSemitones} semitone</p>
        <small>開始 ${escapeHtml(String(contour.startPitch))} → 終了 ${escapeHtml(String(contour.endPitch))}</small>
      </article>
      <article class="advanced-card">
        <div class="advanced-card-heading"><strong>最高音 ${escapeHtml(contour.peak?.pitchName ?? '—')}</strong><span class="status-pill">Peak</span></div>
        <p>全体の約${Math.round((contour.peak?.positionRatio ?? 0) * 100)}%地点</p>
        <small>tick ${contour.peak?.tick ?? '—'} · velocity ${contour.peak?.velocity ?? '—'}</small>
      </article>
      <article class="advanced-card">
        <div class="advanced-card-heading"><strong>Climax候補 ${escapeHtml(contour.climaxCandidate?.pitchName ?? '—')}</strong><span class="status-pill">Evidence</span></div>
        <p>全体の約${climaxPosition}%地点 · score ${contour.climaxCandidate?.score ?? '—'}</p>
        <small>最高音・Velocity・周辺発音密度を合わせた候補</small>
      </article>
    </div>
    <p class="helper-note">${escapeHtml(contour.note)}</p>
  `;
}

function landingRelationLabel(entry) {
  if (entry.chordTone === true && entry.scaleTone === true) return 'Chord + Scale';
  if (entry.chordTone === true) return 'Chord Tone';
  if (entry.scaleTone === true) return 'Scale Tone';
  if (entry.scaleTone === false) return 'Scale外';
  return '候補不足';
}

function renderLandingComparison(insight) {
  const comparison = insight?.landingComparison;
  if (!comparison?.entries?.length) return '<p class="empty-state">Section着地を比較できません。</p>';
  return `
    <div class="advanced-section-grid">
      ${comparison.entries.map((entry) => `
        <article class="advanced-card">
          <div class="advanced-card-heading">
            <strong>Section ${escapeHtml(entry.label)} · ${escapeHtml(entry.pitchName ?? '—')}</strong>
            <span class="status-pill">${escapeHtml(entry.degree ?? '—')}</span>
          </div>
          <p>${escapeHtml(landingRelationLabel(entry))} · ${escapeHtml(entry.beatStrength)}</p>
          <small>${entry.startBar}–${entry.endBar}小節 · Chord ${escapeHtml(entry.chord ?? '—')}</small>
        </article>
      `).join('')}
    </div>
    <p class="helper-note"><strong>${escapeHtml(comparison.summary)}</strong><br>${escapeHtml(comparison.note)}</p>
  `;
}

function renderTopCharacteristics(insight) {
  const items = insight?.topCharacteristics ?? [];
  if (!items.length) return '<p class="empty-state">曲全体の特徴を要約できるEvidenceが不足しています。</p>';
  return `
    <div class="advanced-card-list" data-top-characteristics>
      ${items.map((item, index) => `
        <article class="advanced-card" data-top-characteristic="${escapeHtml(item.id)}">
          <div class="advanced-card-heading"><strong>${index + 1}. ${escapeHtml(item.title)}</strong><span class="status-pill">Insight</span></div>
          <p>${escapeHtml(item.evidence)}</p>
          <small>${escapeHtml(item.meaning)}</small>
        </article>
      `).join('')}
    </div>
    <p class="helper-note">${escapeHtml(insight.note)}</p>
  `;
}

export function mountAdvancedAnalysis(root, song, options = {}) {
  if (!root) return null;
  const section = options.section ?? 'all';
  const motif = section === 'all' || section === 'structure' ? analyzeMotifs(song) : null;
  const structure = section === 'all' || section === 'structure' ? analyzeStructure(song) : null;
  const insight = section === 'all' || section === 'structure' ? analyzeSongInsights(song, { structure }) : null;
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
        <div class="advanced-subheading"><h3>Phrase contour / Peak / Climax候補</h3><span class="status-pill">v0.23</span></div>
        ${renderContour(insight)}
      </section>
      <section class="advanced-subsection">
        <div class="advanced-subheading"><h3>Section間 Landing比較</h3><span class="status-pill">Degree</span></div>
        ${renderLandingComparison(insight)}
      </section>
      <section class="advanced-subsection">
        <div class="advanced-subheading"><h3>曲の特徴 Top 5</h3><span class="status-pill">Evidence</span></div>
        ${renderTopCharacteristics(insight)}
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
  return Object.freeze({ motif, structure, insight, harmony });
}
