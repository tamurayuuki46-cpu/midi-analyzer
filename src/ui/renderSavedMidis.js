function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatSavedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '日時不明';
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function renderSavedMidiList(root, items) {
  if (!items.length) {
    root.innerHTML = `
      <section class="panel" aria-labelledby="saved-title">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">ON THIS DEVICE</p>
            <h2 id="saved-title">保存済みMIDI</h2>
          </div>
        </div>
        <p class="empty-state">保存済みMIDIはまだありません。保存は初期状態ではOFFです。</p>
      </section>
    `;
    return;
  }

  root.innerHTML = `
    <section class="panel" aria-labelledby="saved-title">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">ON THIS DEVICE</p>
          <h2 id="saved-title">保存済みMIDI</h2>
        </div>
        <span class="status-pill">${items.length}件</span>
      </div>
      <div class="saved-list">
        ${items.map((item) => `
          <article class="saved-card">
            <div class="saved-card-main">
              <strong>${escapeHtml(item.source?.fileName ?? 'untitled.mid')}</strong>
              <p>${formatSavedAt(item.savedAt)} · ${item.trackCount} tracks · ${item.noteCount} notes</p>
              <small>${item.source?.origin === 'ripx' ? 'RipX' : 'MIDI'} · 端末内のみ</small>
            </div>
            <button class="delete-button" type="button" data-delete-midi="${escapeHtml(item.id)}">削除</button>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}

export function renderStorageUnavailable(root) {
  root.innerHTML = `
    <section class="panel warning-panel" role="status">
      <p class="eyebrow">STORAGE</p>
      <h2>端末保存を利用できません</h2>
      <p>このブラウザではIndexedDBを利用できないため、MIDIは保存せずメモリ上だけで扱います。</p>
    </section>
  `;
}

export function renderStorageError(root, error) {
  root.innerHTML = `
    <section class="panel error-panel" role="alert">
      <p class="eyebrow">STORAGE ERROR</p>
      <h2>保存情報を読み込めませんでした</h2>
      <p>${escapeHtml(error?.message ?? 'Unknown storage error')}</p>
    </section>
  `;
}
