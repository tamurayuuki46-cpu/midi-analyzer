import './clipLibrary.css';
import { buildClipRecord, buildFourBarRanges, filterClipRecords } from '../library/clipModel.js';
import {
  deleteSavedClip,
  isIndexedDbAvailable,
  listSavedClips,
  saveClipRecord,
} from '../storage/index.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function typeLabel(type) {
  const labels = { chord: 'Chord', melody: 'Melody', bass: 'Bass', drum: 'Drum', motif: 'Motif' };
  return labels[type] ?? type;
}

function rangeLabel(range) {
  return `${range.startBar}–${range.endBar}小節${range.complete ? '' : '（曲末まで）'}`;
}

function tagValues(record) {
  return [
    record.tags?.genre && `Genre: ${record.tags.genre}`,
    record.tags?.mood && `Mood: ${record.tags.mood}`,
    record.tags?.bpm && `BPM: ${record.tags.bpm}`,
    record.tags?.key && `Key: ${record.tags.key}`,
    ...(record.tags?.custom ?? []),
  ].filter(Boolean);
}

function renderRecords(root, records, query) {
  const filtered = filterClipRecords(records, query);
  if (!records.length) {
    root.innerHTML = '<p class="clip-empty">保存済みClipはまだありません。上のフォームから4小節Clipを保存できます。</p>';
    return;
  }
  if (!filtered.length) {
    root.innerHTML = '<p class="clip-empty">検索条件に一致するClipはありません。</p>';
    return;
  }

  root.innerHTML = `<div class="clip-list">
    ${filtered.map((record) => {
      const progression = (record.chordProgression ?? []).map((item) => item.value).filter(Boolean).join(' → ');
      return `<article class="clip-card">
        <div class="clip-card-heading">
          <div>
            <span class="status-pill">${escapeHtml(typeLabel(record.type))}</span>
            <strong>${escapeHtml(record.name)}</strong>
          </div>
          <button class="clip-delete-button" type="button" data-delete-clip="${escapeHtml(record.id)}">削除</button>
        </div>
        <p class="clip-meta">${escapeHtml(record.source?.fileName ?? 'untitled.mid')} · ${escapeHtml(rangeLabel(record.range))} · ${record.notes?.length ?? 0} notes</p>
        ${progression ? `<p class="clip-progression"><strong>Chord:</strong> ${escapeHtml(progression)}</p>` : ''}
        <div class="clip-tags">${tagValues(record).map((tag) => `<span class="clip-tag">${escapeHtml(tag)}</span>`).join('')}</div>
      </article>`;
    }).join('')}
  </div>`;
}

export function mountClipLibrary(root, song) {
  if (!root) return null;
  const ranges = buildFourBarRanges(song);
  let records = [];
  let query = '';

  if (!isIndexedDbAvailable()) {
    root.innerHTML = '<p class="clip-empty">このブラウザではIndexedDBを利用できないため、Clip Libraryは使えません。</p>';
    return null;
  }

  root.innerHTML = `
    <div class="clip-library">
      <form class="clip-form" data-clip-form>
        <div>
          <p class="eyebrow">4-BAR CLIP</p>
          <h3>分析結果をClip Libraryへ保存</h3>
          <p class="helper-note">元MIDIは変更しません。選択区間を端末内Library用データとして保存します。</p>
        </div>
        <div class="clip-form-grid">
          <label class="clip-field"><span>種類</span><select name="type">
            <option value="chord">Chord</option>
            <option value="melody">Melody</option>
            <option value="bass">Bass</option>
            <option value="drum">Drum</option>
            <option value="motif">Motif</option>
          </select></label>
          <label class="clip-field"><span>区間</span><select name="startBar" ${ranges.length ? '' : 'disabled'}>
            ${ranges.map((range) => `<option value="${range.startBar}">${escapeHtml(rangeLabel(range))}</option>`).join('')}
          </select></label>
          <label class="clip-field"><span>名前（任意）</span><input name="name" maxlength="80" placeholder="例: サビ王道進行"></label>
          <label class="clip-field"><span>Genre（任意）</span><input name="genre" maxlength="40" placeholder="J-POP"></label>
          <label class="clip-field"><span>Mood（任意）</span><input name="mood" maxlength="40" placeholder="切ない / bright"></label>
          <label class="clip-field"><span>タグ（カンマ区切り）</span><input name="custom" maxlength="160" placeholder="サビ, 浮遊感, favorite"></label>
        </div>
        <p class="helper-note">BPM / Keyは選択区間から自動タグ付けします。Chord進行もLibrary検索用に同時保存します。</p>
        <div class="clip-form-actions">
          <button class="clip-save-button" type="submit" ${ranges.length ? '' : 'disabled'}>Clipを保存</button>
          <p class="clip-status" data-clip-status aria-live="polite"></p>
        </div>
      </form>

      <label class="clip-search">
        <span>Clip検索</span>
        <input type="search" data-clip-search placeholder="例: J-POP bright C major chorus">
      </label>
      <div data-clip-list></div>
    </div>
  `;

  const form = root.querySelector('[data-clip-form]');
  const status = root.querySelector('[data-clip-status]');
  const search = root.querySelector('[data-clip-search]');
  const listRoot = root.querySelector('[data-clip-list]');

  async function refresh() {
    records = await listSavedClips();
    renderRecords(listRoot, records, query);
    return records;
  }

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    status.textContent = '保存中…';
    try {
      const data = new FormData(form);
      const record = buildClipRecord(song, {
        type: data.get('type'),
        startBar: Number(data.get('startBar')),
        name: data.get('name'),
        tags: {
          genre: data.get('genre'),
          mood: data.get('mood'),
          custom: data.get('custom'),
        },
      });
      await saveClipRecord(record);
      await refresh();
      status.textContent = `${typeLabel(record.type)} Clipを端末内へ保存しました。`;
      form.querySelector('[name="name"]').value = '';
      form.querySelector('[name="custom"]').value = '';
    } catch (error) {
      status.textContent = `保存できませんでした: ${error.message}`;
    } finally {
      submit.disabled = !ranges.length;
    }
  });

  search?.addEventListener('input', () => {
    query = search.value;
    renderRecords(listRoot, records, query);
  });

  root.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-delete-clip]');
    if (!button) return;
    if (!globalThis.confirm('このClipを端末から削除します。よろしいですか？')) return;
    button.disabled = true;
    try {
      await deleteSavedClip(button.dataset.deleteClip);
      await refresh();
      status.textContent = 'Clipを削除しました。';
    } catch (error) {
      status.textContent = `削除できませんでした: ${error.message}`;
      button.disabled = false;
    }
  });

  refresh().catch((error) => {
    status.textContent = `Clip Libraryを読み込めませんでした: ${error.message}`;
  });

  return Object.freeze({ refresh, getRecords: () => Object.freeze([...records]) });
}
