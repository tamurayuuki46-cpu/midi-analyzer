import './visualization.css';
import { buildVisualizationModel } from '../analysis/visualization/index.js';

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

function timeline(items, getLabel, getRange) {
  if (!items.length) return '<p class="empty-state">表示できるTimelineがありません。</p>';
  return `<div class="visual-timeline">${items.map((item) => `
    <article class="visual-chip">
      <small>${escapeHtml(getRange(item))}</small>
      <strong>${escapeHtml(getLabel(item) || '—')}</strong>
      ${Number.isFinite(item.confidence) ? `<small>${percent(item.confidence)}</small>` : ''}
    </article>
  `).join('')}</div>`;
}

function contour(result, label) {
  const active = result.contour.filter((item) => Number.isFinite(item.averagePitch));
  if (!active.length) return `<p class="empty-state">${escapeHtml(label)}のContourを表示できません。</p>`;
  const pitches = active.map((item) => item.averagePitch);
  const min = Math.min(...pitches);
  const max = Math.max(...pitches);
  const span = Math.max(max - min, 1);
  return `<div class="visual-contour" role="img" aria-label="${escapeHtml(label)}の小節ごとの平均Pitch">
    ${result.contour.map((item) => {
      const bottom = Number.isFinite(item.averagePitch) ? ((item.averagePitch - min) / span) * 88 + 8 : null;
      return `<div class="visual-contour-column">
        ${bottom === null ? '' : `<span class="visual-contour-point" style="bottom:${bottom.toFixed(1)}%" title="${item.averagePitch}"></span>`}
        <small>${item.barNumber}</small>
      </div>`;
    }).join('')}
  </div>`;
}

function bars(items, valueKey, label) {
  if (!items.length) return `<p class="empty-state">${escapeHtml(label)}を表示できません。</p>`;
  const max = Math.max(...items.map((item) => Number(item[valueKey]) || 0), 0);
  return `<div class="visual-chart" role="img" aria-label="${escapeHtml(label)}">
    ${items.map((item) => {
      const value = Number(item[valueKey]) || 0;
      const height = max > 0 ? Math.max(2, value / max * 100) : 2;
      return `<div class="visual-bar">
        <div class="visual-bar-track"><span class="visual-bar-fill" style="height:${height.toFixed(1)}%" title="${value}"></span></div>
        <small>${item.barNumber}</small>
      </div>`;
    }).join('')}
  </div>`;
}

function sectionMap(items) {
  if (!items.length) return '<p class="empty-state">Section候補はありません。</p>';
  return `<div class="visual-section-map">${items.map((section) => `
    <article class="visual-section-chip">
      <strong>Section ${escapeHtml(section.label)}</strong>
      <small>${section.startBar}–${section.endBar}小節</small>
      <small>類似度 ${percent(section.similarity)}</small>
    </article>
  `).join('')}</div>`;
}

function heatmap(result) {
  if (!result.bars.length) return '<p class="empty-state">Heatmapを表示できません。</p>';
  const byKey = new Map(result.cells.map((cell) => [`${cell.pitchClass}:${cell.barNumber}`, cell]));
  const rows = [];
  rows.push('<div class="visual-heatmap-label"></div>');
  result.bars.forEach((bar) => rows.push(`<div class="visual-heatmap-bar">${bar}</div>`));
  result.pitchClasses.forEach((name, pitchClass) => {
    rows.push(`<div class="visual-heatmap-label">${escapeHtml(name)}</div>`);
    result.bars.forEach((bar) => {
      const cell = byKey.get(`${pitchClass}:${bar}`);
      const level = cell?.level ?? 0;
      const textColor = level > 0.55 ? '#fff' : '#18181b';
      rows.push(`<div class="visual-heatmap-cell" style="--level:${level};--cell-color:${textColor}" title="${escapeHtml(name)} / ${bar}小節: ${cell?.noteCount ?? 0} notes / velocity ${cell?.averageVelocity ?? 0}">${cell?.noteCount || ''}</div>`);
    });
  });
  return `<div class="visual-heatmap-wrap"><div class="visual-heatmap" style="--bar-count:${result.bars.length}">${rows.join('')}</div></div>${result.truncated ? '<p class="helper-note">Heatmapは先頭16小節を表示しています。</p>' : ''}`;
}

export function mountVisualization(root, song) {
  if (!root) return null;
  const model = buildVisualizationModel(song);
  root.innerHTML = `
    <div class="visual-stack">
      <section class="visual-section">
        <div class="visual-heading"><h3>Tonal Center Timeline</h3><span class="status-pill">Key</span></div>
        ${timeline(model.tonalTimeline, (item) => item.value, (item) => `${item.startBar}–${item.endBar}小節`)}
      </section>
      <section class="visual-section">
        <div class="visual-heading"><h3>Chord Timeline</h3><span class="status-pill">Top 1</span></div>
        ${timeline(model.chordTimeline, (item) => item.value, (item) => `${item.barNumber}小節`)}
      </section>
      <section class="visual-section">
        <div class="visual-heading"><h3>Melody Contour</h3><span class="status-pill">Average Pitch</span></div>
        ${contour(model.melody, 'Melody')}
      </section>
      <section class="visual-section">
        <div class="visual-heading"><h3>Bass Contour</h3><span class="status-pill">Average Pitch</span></div>
        ${contour(model.bass, 'Bass')}
      </section>
      <section class="visual-section">
        <div class="visual-heading"><h3>Rhythm Density</h3><span class="status-pill">Onsets</span></div>
        ${bars(model.rhythm.bars, 'density', '小節ごとのRhythm Density')}
      </section>
      <section class="visual-section">
        <div class="visual-heading"><h3>Energy Curve</h3><span class="status-pill">Density × Velocity</span></div>
        ${bars(model.rhythm.bars, 'energy', '小節ごとのEnergy Curve')}
      </section>
      <section class="visual-section">
        <div class="visual-heading"><h3>Section Map</h3><span class="status-pill">Candidate</span></div>
        ${sectionMap(model.sections)}
      </section>
      <section class="visual-section">
        <div class="visual-heading"><h3>Note / Velocity Heatmap</h3><span class="status-pill">Pitch Class</span></div>
        ${heatmap(model.heatmap)}
      </section>
      <p class="helper-note">${escapeHtml(model.note)}</p>
    </div>
  `;
  return model;
}
