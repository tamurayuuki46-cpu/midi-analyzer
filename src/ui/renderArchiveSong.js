// Archive-owned area for "the song that is open right now": 4-bar Clip Library and Key change.
// Everything here saves or transforms MATERIAL. Nothing here judges the song.

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function renderArchiveSongEmpty(root) {
  if (!root) return;
  root.innerHTML = `
    <section class="panel archive-song-panel" aria-labelledby="archive-song-empty-title">
      <p class="eyebrow">ARCHIVE · OPEN SONG</p>
      <h2 id="archive-song-empty-title">開いている曲の素材づくり</h2>
      <p class="archive-empty">MIDIを読み込むと、ここで4小節Clipの保存・検索と、Key変更した素材の書き出しができます。保存済みMIDIの管理はこの上の一覧です。</p>
    </section>
  `;
}

export function renderArchiveSong(root, song) {
  if (!root) return;
  const fileName = escapeHtml(song?.source?.fileName ?? 'untitled.mid');
  const trackCount = song?.tracks?.length ?? 0;
  const noteCount = song?.notes?.length ?? 0;
  root.innerHTML = `
    <section class="panel archive-song-panel" aria-labelledby="archive-song-title">
      <div class="archive-song-head">
        <div><p class="eyebrow">ARCHIVE · OPEN SONG</p><h2 id="archive-song-title">${fileName}</h2></div>
        <span class="status-pill">${trackCount} tracks · ${noteCount} notes</span>
      </div>
      <p class="helper-note">この曲を素材として残す場所です。元のNoteは変更しません。曲の特徴を見たい時はAnalyzerへ。</p>
      <div class="archive-song-actions"><button type="button" data-open-in-analyzer>この曲をAnalyzerで見る</button></div>
    </section>
    <section class="panel" aria-labelledby="clip-library-title">
      <div class="panel-heading"><div><p class="eyebrow">CLIP LIBRARY</p><h2 id="clip-library-title">4小節素材を保存・検索</h2></div><span class="status-pill">v0.6</span></div>
      <div data-clip-library-root></div>
    </section>
    <section class="panel" aria-labelledby="midi-key-tools-title">
      <div class="panel-heading"><div><p class="eyebrow">KEY CHANGE / MATERIAL</p><h2 id="midi-key-tools-title">Key変更・Song Projectへ適合</h2></div><span class="status-pill">Non-destructive</span></div>
      <div data-midi-key-tools-root></div>
    </section>
  `;
  root.querySelector('[data-open-in-analyzer]')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('midi-analyzer-set-view', { detail: { view: 'analyzer' } }));
  });
}
