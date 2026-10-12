import './chordAnalysis.css';
import { analyzeChords, degreeForPitchClass, getDefaultChordTrackIds } from '../analysis/chord/index.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function usableTracks(song) {
  return (song?.tracks ?? []).filter((track) => !track.isDrums && track.noteCount > 0);
}

function segmentLabel(segment) {
  const start = segment.startGridIndex + 1;
  const end = segment.endGridIndex + 1;
  const grid = start === end ? `Grid ${start}` : `Grid ${start}–${end}`;
  return `${segment.barNumber}小節 · ${grid} · ${segment.numerator}/${segment.denominator}`;
}

export function mountChordAnalysis(root, song, options = {}) {
  if (!root) return null;

  const availableTracks = usableTracks(song);
  let selectedTrackIds = new Set(getDefaultChordTrackIds(song));
  let result = analyzeChords(song, { trackIds: [...selectedTrackIds] });
  const selectedBySegment = new Map();

  function effectiveKey() {
    return options.getEffectiveKey?.() ?? null;
  }

  function keyIsExplicit() {
    return Boolean(options.isKeyExplicit?.());
  }

  function degreeMarkup(candidate) {
    const key = effectiveKey();
    if (!key) return '<span class="degree-chip">Degree —</span>';
    const degree = degreeForPitchClass(candidate.root, key);
    if (!degree) return '<span class="degree-chip">Degree —</span>';
    return `<span class="degree-chip${degree.outOfScale ? ' is-outside' : ''}">${escapeHtml(degree.value)}${degree.outOfScale ? ' · 音階外' : ''}</span>`;
  }

  function renderTrackChoices() {
    if (!availableTracks.length) return '<p class="empty-state">Chord分析に使える非Drum Trackがありません。</p>';
    return `
      <fieldset class="chord-track-fieldset">
        <legend>Chord分析に使うTrack</legend>
        <div class="chord-track-grid">
          ${availableTracks.map((track) => `
            <label class="chord-track-choice">
              <input type="checkbox" data-chord-track="${escapeHtml(track.id)}" ${selectedTrackIds.has(track.id) ? 'checked' : ''}>
              <span>
                <strong>${escapeHtml(track.name)}</strong>
                <small>${track.noteCount} notes${track.roleHint ? ` · ${escapeHtml(track.roleHint)}候補` : ''}</small>
              </span>
            </label>
          `).join('')}
        </div>
      </fieldset>
    `;
  }

  function renderSegments() {
    if (!result.segments.length) return `<p class="empty-state">${escapeHtml(result.note)}</p>`;
    return `
      <div class="chord-segment-list">
        ${result.segments.map((segment) => {
          const selected = selectedBySegment.get(segment.id) ?? null;
          return `
            <article class="chord-segment-card">
              <div class="chord-segment-heading">
                <div>
                  <p class="chord-position">${escapeHtml(segmentLabel(segment))}</p>
                  <strong>${selected ? `選択: ${escapeHtml(selected)}` : 'Chord候補'}</strong>
                </div>
                <span class="status-pill">Top 3</span>
              </div>
              <div class="chord-candidate-list">
                ${segment.candidates.map((candidate, index) => `
                  <button
                    type="button"
                    class="chord-candidate-button${selected === candidate.value ? ' is-selected' : ''}"
                    data-chord-segment="${escapeHtml(segment.id)}"
                    data-chord-value="${escapeHtml(candidate.value)}"
                    aria-pressed="${selected === candidate.value ? 'true' : 'false'}"
                  >
                    <span class="chord-candidate-rank">候補 ${index + 1}</span>
                    <strong>${escapeHtml(candidate.value)}</strong>
                    ${degreeMarkup(candidate)}
                    <small>一致度 ${(candidate.confidence * 100).toFixed(0)}%</small>
                  </button>
                `).join('')}
              </div>
            </article>
          `;
        }).join('')}
      </div>
    `;
  }

  function render() {
    const key = effectiveKey();
    const keyContext = key
      ? (keyIsExplicit() ? `Degree基準: 選択Key ${key}` : `Degree基準: Key候補 ${key} の場合`)
      : 'Degree基準となるKey候補がありません。';

    root.innerHTML = `
      ${renderTrackChoices()}
      <p class="chord-key-context">${escapeHtml(keyContext)}</p>
      ${renderSegments()}
      <p class="helper-note">${escapeHtml(result.note)}</p>
      <p class="chord-parameter-note">暫定値: Bass Bonus 1.5 / Non-Chord Penalty 0.5 / Chord切替閾値 10%。実MIDIで調整予定です。</p>
    `;
  }

  function rerunAnalysis() {
    selectedBySegment.clear();
    result = analyzeChords(song, { trackIds: [...selectedTrackIds] });
    render();
  }

  root.addEventListener('change', (event) => {
    const checkbox = event.target.closest('[data-chord-track]');
    if (!checkbox) return;
    if (checkbox.checked) selectedTrackIds.add(checkbox.dataset.chordTrack);
    else selectedTrackIds.delete(checkbox.dataset.chordTrack);
    rerunAnalysis();
  });

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-chord-segment][data-chord-value]');
    if (!button) return;
    selectedBySegment.set(button.dataset.chordSegment, button.dataset.chordValue);
    render();
    root.dispatchEvent(new CustomEvent('chord-selection-change', {
      bubbles: true,
      detail: {
        segmentId: button.dataset.chordSegment,
        selected: button.dataset.chordValue,
      },
    }));
  });

  render();
  return Object.freeze({
    refreshKeyContext: render,
    getSelectedTrackIds: () => Object.freeze([...selectedTrackIds]),
    getSelections: () => Object.freeze(Object.fromEntries(selectedBySegment)),
  });
}
