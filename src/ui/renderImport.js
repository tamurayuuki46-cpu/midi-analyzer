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

function tabButton(id, label, selected = false) {
  return `<button class="analysis-tab" id="analysis-tab-${id}" type="button" role="tab" aria-selected="${selected ? 'true' : 'false'}" aria-controls="analysis-panel-${id}" data-tab="${id}" tabindex="${selected ? '0' : '-1'}">${label}</button>`;
}

function panelStart(id, selected = false) {
  return `<section class="analysis-tabpanel" id="analysis-panel-${id}" role="tabpanel" aria-labelledby="analysis-tab-${id}" data-tab-panel="${id}" ${selected ? '' : 'hidden'}>`;
}

export function renderSongSummary(root, result) {
  const { song, warnings } = result;
  const firstTempo = song.tempoMap[0];
  const firstMeter = song.timeSignatures[0];

  root.innerHTML = `
    <section class="analysis-tabs" data-analysis-tabs>
      <div class="analysis-tablist" role="tablist" aria-label="MIDI解析カテゴリ">
        ${tabButton('overview', '概要', true)}
        ${tabButton('harmony', 'Harmony')}
        ${tabButton('melody', 'Melody')}
        ${tabButton('bass', 'Bass')}
        ${tabButton('rhythm', 'Rhythm')}
        ${tabButton('structure', 'Structure')}
        ${tabButton('visual', 'Visual')}
        ${tabButton('compare', 'Compare')}
        ${tabButton('library', 'Library')}
        ${tabButton('ai', 'AI')}
        ${tabButton('parts', 'Parts')}
      </div>

      ${panelStart('overview', true)}
        <section class="panel" aria-labelledby="overview-title">
          <div class="panel-heading"><div><p class="eyebrow">IMPORT COMPLETE</p><h2 id="overview-title">${escapeHtml(song.source.fileName)}</h2></div><span class="status-pill">読み取り専用</span></div>
          <dl class="stats-grid">
            <div><dt>PPQ</dt><dd>${song.ppq}</dd></div><div><dt>Track</dt><dd>${song.tracks.length}</dd></div><div><dt>Note</dt><dd>${song.notes.length}</dd></div>
            <div><dt>Tempo</dt><dd>${firstTempo ? firstTempo.bpm.toFixed(1) : '—'} BPM</dd></div><div><dt>拍子</dt><dd>${firstMeter ? `${firstMeter.numerator}/${firstMeter.denominator}` : '—'}</dd></div><div><dt>長さ</dt><dd>${song.lengthTicks} ticks</dd></div>
          </dl>
        </section>

        <section class="panel" aria-labelledby="playback-title"><div class="panel-heading"><div><p class="eyebrow">PREVIEW</p><h2 id="playback-title">簡易再生</h2></div><span class="status-pill">Play / Stop</span></div><div data-playback-root></div></section>

        <section class="panel" aria-labelledby="tracks-title">
          <div class="panel-heading"><div><p class="eyebrow">TRACKS</p><h2 id="tracks-title">Track一覧</h2></div></div>
          <div class="track-list">${song.tracks.map((track) => `<article class="track-card"><div><strong>${escapeHtml(track.name)}</strong><p>${track.noteCount} notes · Channel ${formatChannels(track.channels)}</p></div><div class="track-tags"><span>${formatRole(track.roleHint)}</span>${track.isDrums ? '<span>Channel 10</span>' : ''}</div></article>`).join('')}</div>
        </section>

        <section class="panel piano-roll-panel" aria-labelledby="piano-roll-title"><div class="panel-heading"><div><p class="eyebrow">PIANO ROLL</p><h2 id="piano-roll-title">Noteを確認</h2></div><span class="status-pill">表示専用</span></div><div data-piano-roll-root></div></section>

        ${warnings.length ? `<section class="panel warning-panel" aria-labelledby="warnings-title"><h2 id="warnings-title">読み込み時の注意</h2><p>${warnings.length}件の不完全なNoteイベントを検出しました。元データを勝手に補完せず、分析対象から外しています。</p></section>` : ''}
      </section>

      ${panelStart('harmony')}
        <section class="panel" aria-labelledby="key-analysis-title"><div class="panel-heading"><div><p class="eyebrow">KEY / SCALE</p><h2 id="key-analysis-title">Key候補</h2></div><span class="status-pill">候補</span></div><div data-key-analysis-root></div></section>
        <section class="panel" aria-labelledby="chord-analysis-title"><div class="panel-heading"><div><p class="eyebrow">CHORD / DEGREE</p><h2 id="chord-analysis-title">Chord候補</h2></div><span class="status-pill">候補</span></div><div data-chord-analysis-root></div></section>
        <section class="panel" aria-labelledby="harmony-detail-title"><div class="panel-heading"><div><p class="eyebrow">CHORD DETAIL</p><h2 id="harmony-detail-title">転回形・Slash・Tension</h2></div><span class="status-pill">候補</span></div><div data-advanced-harmony-root></div></section>
      </section>

      ${panelStart('melody')}
        <section class="panel" aria-labelledby="melody-analysis-title"><div class="panel-heading"><div><p class="eyebrow">MELODY</p><h2 id="melody-analysis-title">主旋律分析</h2></div><span class="status-pill">特徴量</span></div><div data-basic-melody-root></div></section>
        <section class="panel" aria-labelledby="counter-melody-title"><div class="panel-heading"><div><p class="eyebrow">COUNTER MELODY</p><h2 id="counter-melody-title">裏メロ分析</h2></div><span class="status-pill">候補</span></div><div data-deep-melody-root></div></section>
      </section>

      ${panelStart('bass')}
        <section class="panel" aria-labelledby="bass-analysis-title"><div class="panel-heading"><div><p class="eyebrow">BASS</p><h2 id="bass-analysis-title">Bass分析</h2></div><span class="status-pill">特徴量</span></div><div data-basic-bass-root></div></section>
        <section class="panel" aria-labelledby="bass-detail-title"><div class="panel-heading"><div><p class="eyebrow">BASS DETAIL</p><h2 id="bass-detail-title">Bass詳細</h2></div><span class="status-pill">候補</span></div><div data-deep-bass-root></div></section>
      </section>

      ${panelStart('rhythm')}
        <section class="panel" aria-labelledby="rhythm-analysis-title"><div class="panel-heading"><div><p class="eyebrow">RHYTHM</p><h2 id="rhythm-analysis-title">Rhythm分析</h2></div><span class="status-pill">特徴量</span></div><div data-basic-rhythm-root></div></section>
        <section class="panel" aria-labelledby="drum-detail-title"><div class="panel-heading"><div><p class="eyebrow">DRUM DETAIL</p><h2 id="drum-detail-title">Drum分析</h2></div><span class="status-pill">GM / Fill</span></div><div data-deep-rhythm-root></div></section>
      </section>

      ${panelStart('structure')}
        <section class="panel" aria-labelledby="structure-analysis-title"><div class="panel-heading"><div><p class="eyebrow">STRUCTURE / MOTIF</p><h2 id="structure-analysis-title">構成・Motif・転調</h2></div><span class="status-pill">候補</span></div><div data-advanced-structure-root></div></section>
      </section>

      ${panelStart('visual')}
        <section class="panel" aria-labelledby="visualization-title"><div class="panel-heading"><div><p class="eyebrow">VISUALIZATION</p><h2 id="visualization-title">曲の流れを可視化</h2></div><span class="status-pill">v0.5</span></div><div data-visualization-root></div></section>
      </section>

      ${panelStart('compare')}
        <section class="panel" aria-labelledby="compare-analysis-title"><div class="panel-heading"><div><p class="eyebrow">COMPARE / PERSONAL TREND</p><h2 id="compare-analysis-title">比較・自分の傾向</h2></div><span class="status-pill">比較</span></div><div data-compare-analysis-root></div></section>
      </section>

      ${panelStart('library')}
        <div data-library-midi-root></div>
        <section class="panel" aria-labelledby="clip-library-title">
          <div class="panel-heading"><div><p class="eyebrow">CLIP LIBRARY</p><h2 id="clip-library-title">4小節素材を保存・検索</h2></div><span class="status-pill">v0.6</span></div>
          <div data-clip-library-root></div>
        </section>
      </section>

      ${panelStart('ai')}
        <section class="panel" aria-labelledby="ai-title">
          <div class="panel-heading"><div><p class="eyebrow">AI</p><h2 id="ai-title">AI分析・説明</h2></div><span class="status-pill">準備中</span></div>
          <div class="tab-placeholder"><h3>AI機能はまだ自動実行しません</h3><p>現在は解析結果を決定論的なAnalyzerで表示しています。将来ここに「なぜこのKey / Chord / 転調なのか」「参考曲から学べる点」などの説明機能を追加します。</p></div>
        </section>
      </section>

      ${panelStart('parts')}
        <section class="panel" aria-labelledby="parts-title"><div class="panel-heading"><div><p class="eyebrow">PARTS</p><h2 id="parts-title">Track役割候補</h2></div><span class="status-pill">候補</span></div><div data-deep-parts-root></div></section>
      </section>
    </section>
  `;
}

export function renderImportError(root, error) {
  root.innerHTML = `<section class="panel error-panel" role="alert"><p class="eyebrow">IMPORT ERROR</p><h2>読み込めませんでした</h2><p>${escapeHtml(error.message || 'Unknown error')}</p></section>`;
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}
