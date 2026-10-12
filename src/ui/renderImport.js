function formatChannels(channels) {
  if (channels.length === 0) return '—';
  return channels.map((channel) => channel + 1).join(', ');
}

function formatRole(roleHint) {
  const labels = {
    melody: 'Melody候補',
    chord: 'Chord候補',
    bass: 'Bass候補',
    drums: 'Drums候補',
  };
  return labels[roleHint] ?? '未判定';
}

export function renderSongSummary(root, result) {
  const { song, warnings } = result;
  const firstTempo = song.tempoMap[0];
  const firstMeter = song.timeSignatures[0];

  root.innerHTML = `
    <section class="panel" aria-labelledby="overview-title">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">IMPORT COMPLETE</p>
          <h2 id="overview-title">${escapeHtml(song.source.fileName)}</h2>
        </div>
        <span class="status-pill">読み取り専用</span>
      </div>

      <dl class="stats-grid">
        <div><dt>PPQ</dt><dd>${song.ppq}</dd></div>
        <div><dt>Track</dt><dd>${song.tracks.length}</dd></div>
        <div><dt>Note</dt><dd>${song.notes.length}</dd></div>
        <div><dt>Tempo</dt><dd>${firstTempo ? firstTempo.bpm.toFixed(1) : '—'} BPM</dd></div>
        <div><dt>拍子</dt><dd>${firstMeter ? `${firstMeter.numerator}/${firstMeter.denominator}` : '—'}</dd></div>
        <div><dt>長さ</dt><dd>${song.lengthTicks} ticks</dd></div>
      </dl>
    </section>

    <section class="panel" aria-labelledby="playback-title">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">PREVIEW</p>
          <h2 id="playback-title">簡易再生</h2>
        </div>
        <span class="status-pill">Play / Stop</span>
      </div>
      <div data-playback-root></div>
    </section>

    <section class="panel" aria-labelledby="tracks-title">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">TRACKS</p>
          <h2 id="tracks-title">Track一覧</h2>
        </div>
      </div>
      <div class="track-list">
        ${song.tracks.map((track) => `
          <article class="track-card">
            <div>
              <strong>${escapeHtml(track.name)}</strong>
              <p>${track.noteCount} notes · Channel ${formatChannels(track.channels)}</p>
            </div>
            <div class="track-tags">
              <span>${formatRole(track.roleHint)}</span>
              ${track.isDrums ? '<span>Channel 10</span>' : ''}
            </div>
          </article>
        `).join('')}
      </div>
    </section>

    <section class="panel" aria-labelledby="key-analysis-title">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">KEY / SCALE</p>
          <h2 id="key-analysis-title">Key候補</h2>
        </div>
        <span class="status-pill">候補</span>
      </div>
      <div data-key-analysis-root></div>
    </section>

    <section class="panel" aria-labelledby="chord-analysis-title">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">CHORD / DEGREE</p>
          <h2 id="chord-analysis-title">Chord候補</h2>
        </div>
        <span class="status-pill">候補</span>
      </div>
      <div data-chord-analysis-root></div>
    </section>

    <section class="panel" aria-labelledby="basic-analysis-title">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">MELODY / BASS / RHYTHM</p>
          <h2 id="basic-analysis-title">基本分析</h2>
        </div>
        <span class="status-pill">特徴量</span>
      </div>
      <div data-basic-analysis-root></div>
    </section>

    <section class="panel" aria-labelledby="advanced-analysis-title">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">V0.2 STRUCTURE / MOTIF</p>
          <h2 id="advanced-analysis-title">発展分析</h2>
        </div>
        <span class="status-pill">候補</span>
      </div>
      <div data-advanced-analysis-root></div>
    </section>

    <section class="panel piano-roll-panel" aria-labelledby="piano-roll-title">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">PIANO ROLL</p>
          <h2 id="piano-roll-title">Noteを確認</h2>
        </div>
        <span class="status-pill">表示専用</span>
      </div>
      <div data-piano-roll-root></div>
    </section>

    ${warnings.length ? `
      <section class="panel warning-panel" aria-labelledby="warnings-title">
        <h2 id="warnings-title">読み込み時の注意</h2>
        <p>${warnings.length}件の不完全なNoteイベントを検出しました。元データを勝手に補完せず、分析対象から外しています。</p>
      </section>
    ` : ''}
  `;
}

export function renderImportError(root, error) {
  root.innerHTML = `
    <section class="panel error-panel" role="alert">
      <p class="eyebrow">IMPORT ERROR</p>
      <h2>読み込めませんでした</h2>
      <p>${escapeHtml(error.message || 'Unknown error')}</p>
    </section>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
