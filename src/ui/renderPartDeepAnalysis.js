import './partDeepAnalysis.css';
import { analyzePartDeep } from '../analysis/deep/index.js';

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

function metric(label, value, detail = '') {
  return `<article class="part-deep-metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>${detail ? `<small>${escapeHtml(detail)}</small>` : ''}</article>`;
}

function renderCounter(result) {
  if (!result.counterTrackId) return `<p class="empty-state">${escapeHtml(result.note)}</p>`;
  return `
    <p class="part-deep-track-pair"><strong>${escapeHtml(result.melodyTrackName ?? 'Melody')}</strong> ↔ <strong>${escapeHtml(result.counterTrackName ?? 'Counter')}</strong></p>
    <div class="part-deep-grid">
      ${metric('反行', percent(result.motion.contraryRatio), `${result.motion.contrary}/${result.motion.evaluated}`)}
      ${metric('並行', percent(result.motion.parallelRatio), `${result.motion.parallel}/${result.motion.evaluated}`)}
      ${metric('斜行', percent(result.motion.obliqueRatio), `${result.motion.oblique}/${result.motion.evaluated}`)}
      ${metric('主旋律の隙間', percent(result.gaps.ratio), `${result.gaps.counterInMelodyGap}/${result.gaps.counterBins}`)}
      ${metric('2度衝突候補', percent(result.collisions.ratio), `${result.collisions.secondIntervalCandidates}/${result.collisions.simultaneousBins}`)}
      ${metric('主旋律より上', percent(result.register.aboveRatio), `上${result.register.above} / 下${result.register.below}`)}
    </div>
    <p class="helper-note">${escapeHtml(result.note)}</p>
  `;
}

function renderBass(result) {
  if (!result.noteCount) return `<p class="empty-state">${escapeHtml(result.note)}</p>`;
  return `
    <p class="part-deep-track-pair"><strong>${escapeHtml(result.trackName)}</strong></p>
    <div class="part-deep-grid">
      ${metric('ペダル候補', `${escapeHtml(result.pedal.name ?? '—')} ${percent(result.pedal.ratio)}`, `${result.pedal.count}/${result.noteCount}発音`)}
      ${metric('オクターブ移動', percent(result.movement.octaveRatio), `${result.movement.octaveMoves}/${result.movement.transitionCount}`)}
      ${metric('半音進行', percent(result.movement.chromaticRatio), `${result.movement.chromaticSteps}/${result.movement.transitionCount}`)}
      ${metric('順次進行 ≤2st', percent(result.movement.stepwiseRatio), `${result.movement.stepwiseMoves}/${result.movement.transitionCount}`)}
      ${metric('次Chord Root接近', percent(result.approach.ratio), `${result.approach.semitoneOrWholeToneToNextRoot}/${result.approach.evaluated}`)}
    </div>
    <p class="helper-note">${escapeHtml(result.note)}</p>
  `;
}

function renderDrums(result) {
  if (!result.noteCount) return `<p class="empty-state">${escapeHtml(result.note)}</p>`;
  const c = result.categoryCounts;
  return `
    <div class="part-deep-grid">
      ${metric('Kick', String(c.kick ?? 0))}
      ${metric('Snare', String(c.snare ?? 0))}
      ${metric('Hi-Hat', String(c.hiHat ?? 0))}
      ${metric('Tom', String(c.tom ?? 0))}
      ${metric('Crash / Ride', `${(c.crash ?? 0) + (c.ride ?? 0)}`)}
      ${metric('平均Onset/小節', String(result.averageOnsetsPerBar ?? '—'))}
    </div>
    <div class="part-deep-chip-row">
      ${result.usedGmNotes.map((item) => `<span class="part-deep-chip">${item.pitch} ${escapeHtml(item.name)} ×${item.count}</span>`).join('')}
    </div>
    ${result.fills.length ? `
      <div class="part-deep-list">
        ${result.fills.map((fill) => `<article><strong>${fill.barNumber}小節 · Fill候補</strong><small>${escapeHtml(fill.reason)} · ${fill.onsetCount} onsets / Tom ${fill.tomCount}</small></article>`).join('')}
      </div>
    ` : '<p class="helper-note">明確なFill候補は見つかりませんでした。</p>'}
    <p class="helper-note">${escapeHtml(result.note)}</p>
  `;
}

function roleLabel(role) {
  const labels = { melody: 'Melody', chord: 'Chord', bass: 'Bass', drums: 'Drums', other: 'Other' };
  return labels[role] ?? role;
}

function renderParts(result) {
  if (!result.candidates.length) return '<p class="empty-state">役割候補を作れるTrackがありません。</p>';
  return `
    <div class="part-deep-list">
      ${result.candidates.map((item) => `
        <article>
          <div class="part-deep-list-heading"><strong>${escapeHtml(item.trackName)}</strong><span class="status-pill">${escapeHtml(roleLabel(item.roleCandidate))} ${percent(item.confidence)}</span></div>
          <small>${escapeHtml(item.reasons.join(' / '))}</small>
        </article>
      `).join('')}
    </div>
    <p class="helper-note">${escapeHtml(result.note)}</p>
  `;
}

export function mountPartDeepAnalysis(root, song, options = {}) {
  if (!root) return null;
  const section = options.section ?? 'all';
  const result = analyzePartDeep(song);
  const blocks = [];

  if (section === 'all' || section === 'melody') {
    blocks.push(`
      <section class="part-deep-section">
        <div class="part-deep-heading"><h3>裏メロ候補</h3><span class="status-pill">Motion / Gap</span></div>
        ${renderCounter(result.counterMelody)}
      </section>
    `);
  }

  if (section === 'all' || section === 'bass') {
    blocks.push(`
      <section class="part-deep-section">
        <div class="part-deep-heading"><h3>Bass詳細</h3><span class="status-pill">Movement</span></div>
        ${renderBass(result.bass)}
      </section>
    `);
  }

  if (section === 'all' || section === 'rhythm') {
    blocks.push(`
      <section class="part-deep-section">
        <div class="part-deep-heading"><h3>Drum詳細</h3><span class="status-pill">GM / Fill</span></div>
        ${renderDrums(result.drums)}
      </section>
    `);
  }

  if (section === 'all' || section === 'parts') {
    blocks.push(`
      <section class="part-deep-section">
        <div class="part-deep-heading"><h3>Track役割候補</h3><span class="status-pill">Candidate</span></div>
        ${renderParts(result.parts)}
      </section>
    `);
  }

  root.innerHTML = `<div class="part-deep-stack">${blocks.join('')}</div>`;
  return result;
}
