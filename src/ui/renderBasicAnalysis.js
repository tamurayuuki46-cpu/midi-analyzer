import './basicAnalysis.css';
import {
  analyzeBass,
  analyzeMelody,
  analyzeRhythm,
  formatMidiPitch,
  getDefaultBassTrackId,
  getDefaultMelodyTrackId,
  getDefaultRhythmTrackIds,
} from '../analysis/basic/index.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function percent(value) {
  if (!Number.isFinite(value)) return '—';
  return `${Math.round(value * 100)}%`;
}

function nonDrumTracks(song) {
  return (song?.tracks ?? []).filter((track) => !track.isDrums && track.noteCount > 0);
}

function rhythmTracks(song) {
  return (song?.tracks ?? []).filter((track) => track.noteCount > 0);
}

function trackOption(track, selectedId) {
  const role = track.roleHint ? ` · ${track.roleHint}候補` : '';
  return `<option value="${escapeHtml(track.id)}" ${track.id === selectedId ? 'selected' : ''}>${escapeHtml(track.name)} (${track.noteCount} notes${escapeHtml(role)})</option>`;
}

function metric(label, value, detail = '') {
  return `
    <div class="basic-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      ${detail ? `<small>${escapeHtml(detail)}</small>` : ''}
    </div>
  `;
}

function provisionalNote(count) {
  if (!count) return '';
  return `<p class="basic-assumption">Chord未選択区間は第1候補を仮使用しています（${count}発音）。Chordを選ぶと再計算します。</p>`;
}

function renderMelody(result) {
  if (!result.noteCount) return `<p class="empty-state">${escapeHtml(result.note)}</p>`;
  const chordTone = result.chordTone.evaluated
    ? `${percent(result.chordTone.ratio)} (${result.chordTone.chordTone}/${result.chordTone.evaluated})`
    : '—';

  return `
    <div class="basic-metric-grid">
      ${metric('音域', `${formatMidiPitch(result.range.low)} – ${formatMidiPitch(result.range.high)}`, `${result.range.semitones} semitones`)}
      ${metric('平均 / 最大跳躍', `${result.leap.averageSemitones} / ${result.leap.maxSemitones}`, 'semitones')}
      ${metric('同音連打', `${result.repeated.count}回`, `${percent(result.repeated.ratio)} of transitions`)}
      ${metric('リズム密度', `${result.density.notesPerQuarter}`, '発音 / 4分音符')}
      ${metric('Chord Tone', chordTone, result.chordTone.evaluated ? `Non-Chord ${result.chordTone.nonChordTone}` : 'Chord区間なし')}
    </div>
    ${provisionalNote(result.chordTone.provisionalCount)}
    <p class="helper-note">${escapeHtml(result.note)}</p>
  `;
}

function renderBass(result) {
  if (!result.noteCount) return `<p class="empty-state">${escapeHtml(result.note)}</p>`;
  const roles = result.chordRole.evaluated
    ? `R ${percent(result.chordRole.rootRatio)} / 3rd ${percent(result.chordRole.thirdRatio)} / 5th ${percent(result.chordRole.fifthRatio)} / Other ${percent(result.chordRole.otherRatio)}`
    : '—';

  return `
    <div class="basic-metric-grid">
      ${metric('最低音の動き', `${result.movement.averageSemitones} avg`, `最大 ${result.movement.maxSemitones} semitones`)}
      ${metric('上下方向', `↑${result.movement.up} / ↓${result.movement.down} / →${result.movement.same}`)}
      ${metric('Chord Root一致', result.chordRole.evaluated ? percent(result.chordRole.rootRatio) : '—', result.chordRole.evaluated ? `${result.chordRole.root}/${result.chordRole.evaluated}` : 'Chord区間なし')}
      ${metric('Root / 3rd / 5th / Other', roles)}
      ${metric('リズムの型', result.rhythm.label, `拍頭 ${percent(result.rhythm.onBeatRatio)}`)}
    </div>
    ${provisionalNote(result.chordRole.provisionalCount)}
    <p class="helper-note">${escapeHtml(result.note)}</p>
  `;
}

function renderGrid(grid) {
  return `
    <div class="basic-grid-block">
      <div class="basic-grid-heading">
        <strong>${escapeHtml(grid.meter)} · 16分Grid</strong>
        <small>${grid.cellCount} positions</small>
      </div>
      <div class="basic-sixteenth-grid" role="img" aria-label="${escapeHtml(grid.meter)}の16分Grid発音数">
        ${grid.cells.map((count, index) => `
          <div class="basic-grid-cell${count ? ' has-onset' : ''}">
            <span>${index + 1}</span>
            <strong>${count}</strong>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderRhythm(result) {
  if (!result.onsetCount) return `<p class="empty-state">${escapeHtml(result.note)}</p>`;
  return `
    <div class="basic-metric-grid">
      ${metric('発音密度', `${result.density.onsetsPerQuarter}`, 'onsets / 4分音符')}
      ${metric('Note密度', `${result.density.notesPerQuarter}`, 'notes / 4分音符')}
      ${metric('拍頭 / 拍頭以外', `${result.beatPosition.onBeat} / ${result.beatPosition.offBeat}`, `拍頭 ${percent(result.beatPosition.onBeatRatio)}`)}
      ${metric('シンコペーション候補', `${result.beatPosition.syncopationCandidateCount}`, '拍頭以外の発音')}
    </div>
    <div class="basic-grid-list">
      ${result.meterGrids.map(renderGrid).join('')}
    </div>
    <p class="helper-note">${escapeHtml(result.note)}</p>
  `;
}

export function mountBasicAnalysis(root, song, options = {}) {
  if (!root) return null;

  const melodyTracks = nonDrumTracks(song);
  const bassTracks = nonDrumTracks(song);
  const rhythmTrackList = rhythmTracks(song);
  let melodyTrackId = getDefaultMelodyTrackId(song);
  let bassTrackId = getDefaultBassTrackId(song);
  let selectedRhythmTrackIds = new Set(getDefaultRhythmTrackIds(song));

  function chordSegments() {
    return options.getChordSegments?.() ?? [];
  }

  function renderTrackSelect(kind, tracks, selectedId) {
    if (!tracks.length) return '<p class="empty-state">選択できるTrackがありません。</p>';
    return `
      <label class="basic-track-select">
        <span>分析対象Track</span>
        <select data-basic-${kind}-track>
          ${tracks.map((track) => trackOption(track, selectedId)).join('')}
        </select>
      </label>
    `;
  }

  function renderRhythmTrackChoices() {
    if (!rhythmTrackList.length) return '<p class="empty-state">選択できるTrackがありません。</p>';
    return `
      <fieldset class="basic-track-fieldset">
        <legend>Rhythm分析に使うTrack</legend>
        <div class="basic-track-checks">
          ${rhythmTrackList.map((track) => `
            <label>
              <input type="checkbox" data-basic-rhythm-track="${escapeHtml(track.id)}" ${selectedRhythmTrackIds.has(track.id) ? 'checked' : ''}>
              <span><strong>${escapeHtml(track.name)}</strong><small>${track.noteCount} notes${track.roleHint ? ` · ${escapeHtml(track.roleHint)}候補` : ''}</small></span>
            </label>
          `).join('')}
        </div>
      </fieldset>
    `;
  }

  function render() {
    const segments = chordSegments();
    const melody = analyzeMelody(song, { trackId: melodyTrackId, chordSegments: segments });
    const bass = analyzeBass(song, { trackId: bassTrackId, chordSegments: segments });
    const rhythm = analyzeRhythm(song, { trackIds: [...selectedRhythmTrackIds] });

    root.innerHTML = `
      <div class="basic-analysis-list">
        <section class="basic-analysis-card" aria-labelledby="melody-basic-title">
          <div class="basic-analysis-heading">
            <div><p class="eyebrow">MELODY</p><h3 id="melody-basic-title">主旋律の特徴</h3></div>
            <span class="status-pill">v0.1</span>
          </div>
          ${renderTrackSelect('melody', melodyTracks, melodyTrackId)}
          ${renderMelody(melody)}
        </section>

        <section class="basic-analysis-card" aria-labelledby="bass-basic-title">
          <div class="basic-analysis-heading">
            <div><p class="eyebrow">BASS</p><h3 id="bass-basic-title">Bassの動き</h3></div>
            <span class="status-pill">v0.1</span>
          </div>
          ${renderTrackSelect('bass', bassTracks, bassTrackId)}
          ${renderBass(bass)}
        </section>

        <section class="basic-analysis-card" aria-labelledby="rhythm-basic-title">
          <div class="basic-analysis-heading">
            <div><p class="eyebrow">RHYTHM</p><h3 id="rhythm-basic-title">発音位置と密度</h3></div>
            <span class="status-pill">v0.1</span>
          </div>
          ${renderRhythmTrackChoices()}
          ${renderRhythm(rhythm)}
        </section>
      </div>
    `;
  }

  root.addEventListener('change', (event) => {
    const melodySelect = event.target.closest('[data-basic-melody-track]');
    if (melodySelect) {
      melodyTrackId = melodySelect.value;
      render();
      return;
    }

    const bassSelect = event.target.closest('[data-basic-bass-track]');
    if (bassSelect) {
      bassTrackId = bassSelect.value;
      render();
      return;
    }

    const rhythmCheckbox = event.target.closest('[data-basic-rhythm-track]');
    if (rhythmCheckbox) {
      if (rhythmCheckbox.checked) selectedRhythmTrackIds.add(rhythmCheckbox.dataset.basicRhythmTrack);
      else selectedRhythmTrackIds.delete(rhythmCheckbox.dataset.basicRhythmTrack);
      render();
    }
  });

  render();
  return Object.freeze({
    refreshChordContext: render,
    getSelection: () => Object.freeze({
      melodyTrackId,
      bassTrackId,
      rhythmTrackIds: Object.freeze([...selectedRhythmTrackIds]),
    }),
  });
}
