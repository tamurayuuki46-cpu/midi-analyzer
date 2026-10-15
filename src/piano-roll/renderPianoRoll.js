import {
  ZOOM_LEVELS,
  buildTimelineMarkers,
  formatMidiNoteName,
  getDefaultTrackId,
  getPitchRange,
  getTrackNotes,
} from './model.js';

const AXIS_WIDTH = 50;
const ROW_HEIGHT = 12;
const TOP_GUTTER = 22;
const MAX_TIMELINE_WIDTH = 120000;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function trackLabel(track) {
  const channelText = track.channels?.length
    ? `Ch ${track.channels.map((channel) => channel + 1).join(', ')}`
    : 'Ch —';
  return `${track.name} · ${track.noteCount} notes · ${channelText}`;
}

function buildPitchAxis(minPitch, maxPitch) {
  const labels = [];
  for (let pitch = maxPitch; pitch >= minPitch; pitch -= 1) {
    if (pitch % 12 !== 0) continue;
    const top = TOP_GUTTER + (maxPitch - pitch) * ROW_HEIGHT;
    labels.push(`<span class="pitch-label" style="top:${top}px">${formatMidiNoteName(pitch)}</span>`);
  }
  return labels.join('');
}

function noteFunctionEntry(result, note, trackId) {
  if (!result || result.trackId !== trackId) return null;
  if (note.id) {
    const byId = result.notes?.find((entry) => entry.id === note.id);
    if (byId) return byId;
  }
  return result.notes?.find((entry) => entry.startTick === note.startTick && entry.pitch === note.pitch) ?? null;
}

function noteFunctionClasses(entry) {
  if (!entry) return '';
  const relationClass = {
    both: ' is-function-both',
    'scale-only': ' is-function-scale-only',
    'chord-only': ' is-function-chord-only',
    'outside-both': ' is-function-outside-both',
  }[entry.relation] ?? ' is-function-unresolved';
  const temporalClass = {
    'passing-candidate': ' is-passing-candidate',
    'neighbor-candidate': ' is-neighbor-candidate',
    'approach-candidate': ' is-approach-candidate',
  }[entry.functionCandidate] ?? '';
  const resolutionClass = entry.resolutionCandidate ? ' is-resolution-candidate' : '';
  const suspensionClass = entry.suspensionCandidate ? ' is-suspension-candidate' : '';
  const anticipationClass = entry.anticipationCandidate ? ' is-anticipation-candidate' : '';
  return `${relationClass}${temporalClass}${resolutionClass}${suspensionClass}${anticipationClass}`;
}

function noteFunctionLabel(entry) {
  if (!entry) return '';
  const relation = {
    both: 'Chord Tone + Scale Tone',
    'scale-only': 'Chord外 / Scale内',
    'chord-only': 'Chord内 / Scale外',
    'outside-both': 'Chord外 / Scale外',
    unresolved: '役割未判定',
  }[entry.relation] ?? '役割未判定';
  const labels = [relation];
  const temporal = {
    'passing-candidate': 'Passing候補',
    'neighbor-candidate': 'Neighbor候補',
    'approach-candidate': 'Approach候補',
  }[entry.functionCandidate] ?? null;
  if (temporal) labels.push(temporal);
  if (entry.resolutionCandidate) labels.push('Resolution候補');
  if (entry.suspensionCandidate) labels.push('Suspension候補');
  if (entry.anticipationCandidate) labels.push('Anticipation候補');
  return labels.join(' / ');
}

function buildSvg(song, notes, minPitch, maxPitch, timelineWidth, stageHeight, noteFunctionResult, trackId) {
  const lengthTicks = Math.max(1, song.lengthTicks || 1);
  const drawableWidth = Math.max(1, timelineWidth - 12);
  const tickToX = (tick) => Math.max(0, Math.min(drawableWidth, tick / lengthTicks * drawableWidth));
  const markers = buildTimelineMarkers(song);
  const gridRows = [];
  for (let pitch = maxPitch; pitch >= minPitch; pitch -= 1) {
    const y = TOP_GUTTER + (maxPitch - pitch) * ROW_HEIGHT;
    gridRows.push(`<line class="pitch-grid${pitch % 12 === 0 ? ' pitch-grid-c' : ''}" x1="0" y1="${y}" x2="${timelineWidth}" y2="${y}" />`);
  }
  const timeline = markers.map((marker) => {
    const x = tickToX(marker.tick);
    if (marker.kind === 'bar') {
      return `<g><line class="bar-line" x1="${x}" y1="0" x2="${x}" y2="${stageHeight}" /><text class="bar-label" x="${x + 4}" y="14">${escapeHtml(marker.label)}</text></g>`;
    }
    return `<line class="beat-line" x1="${x}" y1="${TOP_GUTTER}" x2="${x}" y2="${stageHeight}" />`;
  }).join('');
  const noteRects = notes.map((note) => {
    const x = tickToX(note.startTick);
    const endX = tickToX(note.startTick + note.durationTick);
    const width = Math.max(2, endX - x);
    const y = TOP_GUTTER + (maxPitch - note.pitch) * ROW_HEIGHT + 1;
    const height = Math.max(3, ROW_HEIGHT - 2);
    const functionEntry = noteFunctionEntry(noteFunctionResult, note, trackId);
    const roleLabel = noteFunctionLabel(functionEntry);
    const aria = `${formatMidiNoteName(note.pitch)} start ${note.startTick} duration ${note.durationTick}${roleLabel ? ` ${roleLabel}` : ''}`;
    return `<rect class="piano-note${noteFunctionClasses(functionEntry)}" x="${x}" y="${y}" width="${width}" height="${height}" rx="2" aria-label="${escapeHtml(aria)}">${roleLabel ? `<title>${escapeHtml(roleLabel)}</title>` : ''}</rect>`;
  }).join('');
  return `<svg class="piano-roll-svg" width="${timelineWidth}" height="${stageHeight}" viewBox="0 0 ${timelineWidth} ${stageHeight}" role="img" aria-label="選択Trackの読み取り専用Piano Roll">${gridRows.join('')}${timeline}${noteRects}</svg>`;
}

export function mountPianoRoll(root, song) {
  if (!root) return null;
  const tracks = (song.tracks ?? []).filter((track) => track.noteCount > 0);
  if (!tracks.length) {
    root.innerHTML = '<p class="empty-state">表示できるNoteがありません。</p>';
    return null;
  }
  const state = { trackId: getDefaultTrackId(song) ?? tracks[0].id, zoomIndex: 1, noteFunctionResult: null };
  root.innerHTML = `
    <div class="piano-roll-controls">
      <label class="piano-roll-track-field"><span>表示Track</span><select data-piano-roll-track>${tracks.map((track) => `<option value="${escapeHtml(track.id)}"${track.id === state.trackId ? ' selected' : ''}>${escapeHtml(trackLabel(track))}</option>`).join('')}</select></label>
      <div class="zoom-control" aria-label="Piano Roll zoom"><span>横ズーム</span><div class="zoom-buttons"><button type="button" data-zoom-out aria-label="縮小">−</button><output data-zoom-label>${ZOOM_LEVELS[state.zoomIndex]} px/4分</output><button type="button" data-zoom-in aria-label="拡大">＋</button></div></div>
    </div>
    <p class="piano-roll-meta" data-piano-roll-meta></p>
    <div class="piano-roll-function-guide" data-piano-roll-function-guide hidden>
      <p data-piano-roll-function-status></p>
      <div class="piano-roll-function-legend" aria-label="音の役割色分け"><span><i class="legend-both"></i>Chord + Scale</span><span><i class="legend-scale-only"></i>Chord外 / Scale内</span><span><i class="legend-chord-only"></i>Chord内 / Scale外</span><span><i class="legend-outside-both"></i>Chord外 / Scale外</span></div>
      <small>Passing / Neighbor / Approachに加え、Resolution / Suspension / Anticipation候補もNoteの輪郭で補助表示します。すべて分析候補であり、正誤判定ではありません。</small>
    </div>
    <div class="piano-roll-scroll" data-piano-roll-scroll tabindex="0" aria-label="Piano Roll。左右と上下にスクロールできます。"><div class="piano-roll-stage" data-piano-roll-stage></div></div>
    <p class="helper-note">表示専用です。Noteの移動・長さ変更・Quantizeは行いません。拡大縮小は ± ボタンを使えます。</p>`;

  const trackSelect = root.querySelector('[data-piano-roll-track]');
  const zoomOut = root.querySelector('[data-zoom-out]');
  const zoomIn = root.querySelector('[data-zoom-in]');
  const zoomLabel = root.querySelector('[data-zoom-label]');
  const meta = root.querySelector('[data-piano-roll-meta]');
  const functionGuide = root.querySelector('[data-piano-roll-function-guide]');
  const functionStatus = root.querySelector('[data-piano-roll-function-status]');
  const scroll = root.querySelector('[data-piano-roll-scroll]');
  const stage = root.querySelector('[data-piano-roll-stage]');

  function updateFunctionGuide() {
    const result = state.noteFunctionResult;
    if (!result) { functionGuide.hidden = true; return; }
    functionGuide.hidden = false;
    if (result.trackId !== state.trackId) {
      const analyzedTrack = tracks.find((track) => track.id === result.trackId);
      functionStatus.textContent = `音の役割色分けはMelody分析Track「${analyzedTrack?.name ?? result.trackId}」で表示します。`;
      functionGuide.dataset.active = 'false';
      return;
    }
    const key = result.key?.value ?? 'Key未判定';
    const scale = result.scaleBasis?.label ?? 'Scale未判定';
    const resolution = result.resolution ? ` · Resolve ${result.resolution.resolved}/${result.resolution.evaluated}` : '';
    functionStatus.textContent = `音の役割色分け: ${key} / ${scale}${resolution}`;
    functionGuide.dataset.active = 'true';
  }

  function draw({ resetScroll = false } = {}) {
    const oldMaxScrollLeft = Math.max(0, scroll.scrollWidth - scroll.clientWidth);
    const oldRatio = oldMaxScrollLeft > 0 ? scroll.scrollLeft / oldMaxScrollLeft : 0;
    const notes = getTrackNotes(song, state.trackId);
    const { minPitch, maxPitch } = getPitchRange(notes);
    const pitchSpan = maxPitch - minPitch + 1;
    const stageHeight = TOP_GUTTER + pitchSpan * ROW_HEIGHT + 2;
    const pxPerQuarter = ZOOM_LEVELS[state.zoomIndex];
    const ppq = Math.max(1, Number(song.ppq) || 480);
    const rawTimelineWidth = Math.max(320, Math.ceil((Math.max(1, song.lengthTicks) / ppq) * pxPerQuarter) + 12);
    const timelineWidth = Math.min(MAX_TIMELINE_WIDTH, rawTimelineWidth);
    stage.style.width = `${AXIS_WIDTH + timelineWidth}px`;
    stage.style.height = `${stageHeight}px`;
    stage.innerHTML = `<div class="pitch-axis" style="width:${AXIS_WIDTH}px;height:${stageHeight}px">${buildPitchAxis(minPitch, maxPitch)}</div><div class="piano-roll-timeline" style="left:${AXIS_WIDTH}px;width:${timelineWidth}px;height:${stageHeight}px">${buildSvg(song, notes, minPitch, maxPitch, timelineWidth, stageHeight, state.noteFunctionResult, state.trackId)}</div>`;
    const track = tracks.find((item) => item.id === state.trackId);
    meta.textContent = `${track?.name ?? 'Track'} · ${notes.length} notes · ${formatMidiNoteName(maxPitch)} 〜 ${formatMidiNoteName(minPitch)}`;
    zoomLabel.textContent = `${pxPerQuarter} px/4分`;
    zoomOut.disabled = state.zoomIndex === 0;
    zoomIn.disabled = state.zoomIndex === ZOOM_LEVELS.length - 1;
    updateFunctionGuide();
    requestAnimationFrame(() => {
      if (resetScroll) { scroll.scrollLeft = 0; scroll.scrollTop = 0; return; }
      const newMaxScrollLeft = Math.max(0, scroll.scrollWidth - scroll.clientWidth);
      scroll.scrollLeft = oldRatio * newMaxScrollLeft;
    });
  }

  trackSelect.addEventListener('change', () => { state.trackId = trackSelect.value; draw({ resetScroll: true }); });
  zoomOut.addEventListener('click', () => { if (state.zoomIndex === 0) return; state.zoomIndex -= 1; draw(); });
  zoomIn.addEventListener('click', () => { if (state.zoomIndex >= ZOOM_LEVELS.length - 1) return; state.zoomIndex += 1; draw(); });
  function handleNoteFunctionChange(event) {
    if (!root.isConnected) { document.removeEventListener('note-function-analysis-change', handleNoteFunctionChange); return; }
    state.noteFunctionResult = event.detail?.result ?? null;
    draw();
  }
  document.addEventListener('note-function-analysis-change', handleNoteFunctionChange);
  draw({ resetScroll: true });
  return Object.freeze({ destroy: () => document.removeEventListener('note-function-analysis-change', handleNoteFunctionChange) });
}
