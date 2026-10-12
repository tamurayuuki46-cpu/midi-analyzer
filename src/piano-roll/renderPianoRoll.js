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
    labels.push(
      `<span class="pitch-label" style="top:${top}px">${formatMidiNoteName(pitch)}</span>`,
    );
  }
  return labels.join('');
}

function buildSvg(song, notes, minPitch, maxPitch, timelineWidth, stageHeight) {
  const lengthTicks = Math.max(1, song.lengthTicks || 1);
  const drawableWidth = Math.max(1, timelineWidth - 12);
  const tickToX = (tick) => Math.max(0, Math.min(drawableWidth, tick / lengthTicks * drawableWidth));
  const markers = buildTimelineMarkers(song);

  const gridRows = [];
  for (let pitch = maxPitch; pitch >= minPitch; pitch -= 1) {
    const y = TOP_GUTTER + (maxPitch - pitch) * ROW_HEIGHT;
    gridRows.push(
      `<line class="pitch-grid${pitch % 12 === 0 ? ' pitch-grid-c' : ''}" x1="0" y1="${y}" x2="${timelineWidth}" y2="${y}" />`,
    );
  }

  const timeline = markers.map((marker) => {
    const x = tickToX(marker.tick);
    if (marker.kind === 'bar') {
      return `<g>
        <line class="bar-line" x1="${x}" y1="0" x2="${x}" y2="${stageHeight}" />
        <text class="bar-label" x="${x + 4}" y="14">${escapeHtml(marker.label)}</text>
      </g>`;
    }
    return `<line class="beat-line" x1="${x}" y1="${TOP_GUTTER}" x2="${x}" y2="${stageHeight}" />`;
  }).join('');

  const noteRects = notes.map((note) => {
    const x = tickToX(note.startTick);
    const endX = tickToX(note.startTick + note.durationTick);
    const width = Math.max(2, endX - x);
    const y = TOP_GUTTER + (maxPitch - note.pitch) * ROW_HEIGHT + 1;
    const height = Math.max(3, ROW_HEIGHT - 2);
    return `<rect
      class="piano-note"
      x="${x}"
      y="${y}"
      width="${width}"
      height="${height}"
      rx="2"
      aria-label="${escapeHtml(`${formatMidiNoteName(note.pitch)} start ${note.startTick} duration ${note.durationTick}`)}"
    />`;
  }).join('');

  return `<svg
    class="piano-roll-svg"
    width="${timelineWidth}"
    height="${stageHeight}"
    viewBox="0 0 ${timelineWidth} ${stageHeight}"
    role="img"
    aria-label="選択Trackの読み取り専用Piano Roll"
  >
    ${gridRows.join('')}
    ${timeline}
    ${noteRects}
  </svg>`;
}

export function mountPianoRoll(root, song) {
  if (!root) return;

  const tracks = (song.tracks ?? []).filter((track) => track.noteCount > 0);
  if (!tracks.length) {
    root.innerHTML = '<p class="empty-state">表示できるNoteがありません。</p>';
    return;
  }

  const state = {
    trackId: getDefaultTrackId(song) ?? tracks[0].id,
    zoomIndex: 1,
  };

  root.innerHTML = `
    <div class="piano-roll-controls">
      <label class="piano-roll-track-field">
        <span>表示Track</span>
        <select data-piano-roll-track>
          ${tracks.map((track) => `
            <option value="${escapeHtml(track.id)}"${track.id === state.trackId ? ' selected' : ''}>
              ${escapeHtml(trackLabel(track))}
            </option>
          `).join('')}
        </select>
      </label>

      <div class="zoom-control" aria-label="Piano Roll zoom">
        <span>横ズーム</span>
        <div class="zoom-buttons">
          <button type="button" data-zoom-out aria-label="縮小">−</button>
          <output data-zoom-label>${ZOOM_LEVELS[state.zoomIndex]} px/4分</output>
          <button type="button" data-zoom-in aria-label="拡大">＋</button>
        </div>
      </div>
    </div>

    <p class="piano-roll-meta" data-piano-roll-meta></p>

    <div
      class="piano-roll-scroll"
      data-piano-roll-scroll
      tabindex="0"
      aria-label="Piano Roll。左右と上下にスクロールできます。"
    >
      <div class="piano-roll-stage" data-piano-roll-stage></div>
    </div>

    <p class="helper-note">表示専用です。Noteの移動・長さ変更・Quantizeは行いません。拡大縮小は ± ボタンを使えます。</p>
  `;

  const trackSelect = root.querySelector('[data-piano-roll-track]');
  const zoomOut = root.querySelector('[data-zoom-out]');
  const zoomIn = root.querySelector('[data-zoom-in]');
  const zoomLabel = root.querySelector('[data-zoom-label]');
  const meta = root.querySelector('[data-piano-roll-meta]');
  const scroll = root.querySelector('[data-piano-roll-scroll]');
  const stage = root.querySelector('[data-piano-roll-stage]');

  function draw({ resetScroll = false } = {}) {
    const oldMaxScrollLeft = Math.max(0, scroll.scrollWidth - scroll.clientWidth);
    const oldRatio = oldMaxScrollLeft > 0 ? scroll.scrollLeft / oldMaxScrollLeft : 0;

    const notes = getTrackNotes(song, state.trackId);
    const { minPitch, maxPitch } = getPitchRange(notes);
    const pitchSpan = maxPitch - minPitch + 1;
    const stageHeight = TOP_GUTTER + pitchSpan * ROW_HEIGHT + 2;
    const pxPerQuarter = ZOOM_LEVELS[state.zoomIndex];
    const ppq = Math.max(1, Number(song.ppq) || 480);
    const rawTimelineWidth = Math.max(
      320,
      Math.ceil((Math.max(1, song.lengthTicks) / ppq) * pxPerQuarter) + 12,
    );
    const timelineWidth = Math.min(MAX_TIMELINE_WIDTH, rawTimelineWidth);

    stage.style.width = `${AXIS_WIDTH + timelineWidth}px`;
    stage.style.height = `${stageHeight}px`;
    stage.innerHTML = `
      <div class="pitch-axis" style="width:${AXIS_WIDTH}px;height:${stageHeight}px">
        ${buildPitchAxis(minPitch, maxPitch)}
      </div>
      <div class="piano-roll-timeline" style="left:${AXIS_WIDTH}px;width:${timelineWidth}px;height:${stageHeight}px">
        ${buildSvg(song, notes, minPitch, maxPitch, timelineWidth, stageHeight)}
      </div>
    `;

    const track = tracks.find((item) => item.id === state.trackId);
    meta.textContent = `${track?.name ?? 'Track'} · ${notes.length} notes · ${formatMidiNoteName(maxPitch)} 〜 ${formatMidiNoteName(minPitch)}`;
    zoomLabel.textContent = `${pxPerQuarter} px/4分`;
    zoomOut.disabled = state.zoomIndex === 0;
    zoomIn.disabled = state.zoomIndex === ZOOM_LEVELS.length - 1;

    requestAnimationFrame(() => {
      if (resetScroll) {
        scroll.scrollLeft = 0;
        scroll.scrollTop = 0;
        return;
      }
      const newMaxScrollLeft = Math.max(0, scroll.scrollWidth - scroll.clientWidth);
      scroll.scrollLeft = oldRatio * newMaxScrollLeft;
    });
  }

  trackSelect.addEventListener('change', () => {
    state.trackId = trackSelect.value;
    draw({ resetScroll: true });
  });

  zoomOut.addEventListener('click', () => {
    if (state.zoomIndex === 0) return;
    state.zoomIndex -= 1;
    draw();
  });

  zoomIn.addEventListener('click', () => {
    if (state.zoomIndex >= ZOOM_LEVELS.length - 1) return;
    state.zoomIndex += 1;
    draw();
  });

  draw({ resetScroll: true });
}
