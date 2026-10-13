import './partRecorder.css';
import {
  audioExtensionForMimeType,
  buildPartSong,
  buildTakeRecord,
  createPartRecorderController,
  inferPartTrackIds,
  isPartRecorderSupported,
} from '../recording/index.js';
import {
  deleteSavedTake,
  getSavedTake,
  isIndexedDbAvailable,
  listSavedTakes,
  saveTakeRecord,
} from '../storage/index.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function partLabel(type) {
  return ({ melody: 'Melody', chord: 'Chord', bass: 'Bass', drum: 'Drum' })[type] ?? type;
}

function formatDuration(value) {
  const seconds = Math.max(0, Number(value) || 0);
  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;
  return `${minutes}:${rest.toFixed(1).padStart(4, '0')}`;
}

function formatBytes(value) {
  const bytes = Math.max(0, Number(value) || 0);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function safeFileName(value) {
  return String(value || 'take')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80) || 'take';
}

function makeAudioUrl(record) {
  const blob = new Blob([record.audioBytes], { type: record.mimeType || 'audio/webm' });
  return URL.createObjectURL(blob);
}

export function mountPartRecorder(root, song) {
  if (!root) return null;

  let activeRecorder = null;
  let recordingSession = null;
  let takeSummaries = [];
  let previewUrl = null;
  let aUrl = null;
  let bUrl = null;

  const supported = isPartRecorderSupported();
  const storageAvailable = isIndexedDbAvailable();

  root.innerHTML = `
    <div class="part-recorder">
      <form class="recorder-form" data-recorder-form>
        <div>
          <p class="eyebrow">PART RECORDER</p>
          <h3>パートを分けてAudio録音</h3>
          <p class="helper-note">選択したTrackだけをSolo状態で簡易音源再生し、そのAudioを端末内Takeとして保存します。元MIDIは変更しません。</p>
        </div>

        <div class="recorder-grid">
          <label class="recorder-field"><span>パート</span><select name="partType">
            <option value="melody">Melody</option>
            <option value="chord">Chord</option>
            <option value="bass">Bass</option>
            <option value="drum">Drum</option>
          </select></label>
          <label class="recorder-field"><span>Take名（任意）</span><input type="text" name="name" maxlength="80" placeholder="例: Melody Take A"></label>
        </div>

        <div>
          <p class="eyebrow">TRACKS</p>
          <div class="recorder-tracks" data-recorder-tracks></div>
        </div>

        <label class="recorder-monitor"><input type="checkbox" name="monitor" checked><span>録音中にモニター音を鳴らす</span></label>

        <div class="recorder-actions">
          <button class="rec-button" type="submit" ${supported && storageAvailable ? '' : 'disabled'}>● REC</button>
          <button class="stop-button" type="button" data-stop-recording disabled>■ STOP</button>
        </div>
        <p class="recorder-status" data-recorder-status aria-live="polite"></p>
      </form>

      <div>
        <p class="eyebrow">TAKE PREVIEW</p>
        <audio class="take-preview" data-take-preview controls></audio>
      </div>

      <div class="ab-compare">
        <p class="eyebrow">A / B COMPARE</p>
        <div class="ab-slot"><strong>Take A</strong><span data-ab-a-label>未選択</span><audio class="ab-audio" data-ab-audio controls></audio></div>
        <div class="ab-slot"><strong>Take B</strong><span data-ab-b-label>未選択</span><audio class="ab-audio" data-ab-b-audio controls></audio></div>
      </div>

      <div>
        <p class="eyebrow">SAVED TAKES</p>
        <div data-take-list></div>
      </div>
    </div>
  `;

  const form = root.querySelector('[data-recorder-form]');
  const partSelect = form.querySelector('[name="partType"]');
  const tracksRoot = root.querySelector('[data-recorder-tracks]');
  const status = root.querySelector('[data-recorder-status]');
  const recButton = form.querySelector('.rec-button');
  const stopButton = root.querySelector('[data-stop-recording]');
  const listRoot = root.querySelector('[data-take-list]');
  const preview = root.querySelector('[data-take-preview]');
  const aAudio = root.querySelector('[data-ab-audio]');
  const bAudio = root.querySelector('[data-ab-b-audio]');
  const aLabel = root.querySelector('[data-ab-a-label]');
  const bLabel = root.querySelector('[data-ab-b-label]');

  function revoke(refName) {
    const value = refName === 'preview' ? previewUrl : refName === 'a' ? aUrl : bUrl;
    if (value) URL.revokeObjectURL(value);
    if (refName === 'preview') previewUrl = null;
    if (refName === 'a') aUrl = null;
    if (refName === 'b') bUrl = null;
  }

  function selectedTrackIds() {
    return [...tracksRoot.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.value);
  }

  function renderTracks(partType) {
    const defaults = new Set(inferPartTrackIds(song, partType));
    const tracks = (song.tracks ?? []).filter((track) => (song.notes ?? []).some((note) => note.trackId === track.id));
    tracksRoot.innerHTML = tracks.map((track) => `
      <label class="recorder-track">
        <input type="checkbox" value="${escapeHtml(track.id)}" ${defaults.has(track.id) ? 'checked' : ''}>
        <span><strong>${escapeHtml(track.name)}</strong><small>${track.noteCount ?? 0} notes · ${escapeHtml(track.roleHint ?? 'role未判定')}${track.isDrums ? ' · Drums' : ''}</small></span>
      </label>
    `).join('');
  }

  function renderTakes() {
    if (!takeSummaries.length) {
      listRoot.innerHTML = '<p class="recorder-empty">保存済みTakeはまだありません。</p>';
      return;
    }

    listRoot.innerHTML = `<div class="take-list">${takeSummaries.map((take) => `
      <article class="take-card">
        <div class="take-card-heading"><div><span class="status-pill">${escapeHtml(partLabel(take.partType))}</span> <strong>${escapeHtml(take.name || 'Take')}</strong></div></div>
        <p class="take-meta">${escapeHtml(take.source?.fileName ?? 'untitled.mid')} · ${escapeHtml(formatDuration(take.durationSeconds))} · ${escapeHtml(formatBytes(take.size))}</p>
        <div class="take-actions">
          <button class="take-button" type="button" data-preview-take="${escapeHtml(take.id)}">再生</button>
          <button class="take-button" type="button" data-set-a="${escapeHtml(take.id)}">Aにセット</button>
          <button class="take-button" type="button" data-set-b="${escapeHtml(take.id)}">Bにセット</button>
          <button class="take-button" type="button" data-export-take="${escapeHtml(take.id)}">Audio書き出し</button>
          <button class="take-button" type="button" data-delete-take="${escapeHtml(take.id)}">削除</button>
        </div>
      </article>
    `).join('')}</div>`;
  }

  async function refresh() {
    takeSummaries = storageAvailable ? await listSavedTakes() : [];
    renderTakes();
    return takeSummaries;
  }

  async function loadToAudio(id, audioElement, slot) {
    const record = await getSavedTake(id);
    if (!record) throw new Error('Takeが見つかりません。');
    revoke(slot);
    const url = makeAudioUrl(record);
    if (slot === 'preview') previewUrl = url;
    if (slot === 'a') aUrl = url;
    if (slot === 'b') bUrl = url;
    audioElement.src = url;
    audioElement.load();
    return record;
  }

  async function finalizeTake(result) {
    if (!recordingSession) return;
    const session = recordingSession;
    recordingSession = null;
    try {
      const record = await buildTakeRecord(song, {
        blob: result.blob,
        mimeType: result.mimeType,
        durationSeconds: result.durationSeconds,
        eventCount: result.eventCount,
        partType: session.partType,
        trackIds: session.trackIds,
        name: session.name,
      });
      await saveTakeRecord(record);
      await refresh();
      status.textContent = `${partLabel(record.partType)} Takeを端末内へ保存しました。`;
      await loadToAudio(record.id, preview, 'preview');
    } catch (error) {
      status.textContent = `録音Takeを保存できませんでした: ${error.message}`;
    } finally {
      activeRecorder = null;
      recButton.disabled = false;
      stopButton.disabled = true;
    }
  }

  renderTracks(partSelect.value);
  if (!supported) status.textContent = 'このブラウザはWeb Audio / MediaRecorder分離録音に対応していません。';
  else if (!storageAvailable) status.textContent = 'このブラウザはIndexedDB保存に対応していないため、Takeを保存できません。';

  partSelect.addEventListener('change', () => renderTracks(partSelect.value));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (activeRecorder) return;
    const trackIds = selectedTrackIds();
    if (!trackIds.length) {
      status.textContent = '録音するTrackを1つ以上選んでください。';
      return;
    }

    try {
      const partSong = buildPartSong(song, trackIds);
      const partType = partSelect.value;
      recordingSession = {
        partType,
        trackIds,
        name: form.querySelector('[name="name"]').value,
      };
      activeRecorder = createPartRecorderController(partSong, {
        monitor: form.querySelector('[name="monitor"]').checked,
        onStateChange(state) {
          if (state.state === 'recording') status.textContent = `${partLabel(partType)}を録音中… STOPで途中停止できます。`;
        },
        onComplete(result) {
          void finalizeTake(result);
        },
      });
      recButton.disabled = true;
      stopButton.disabled = false;
      await activeRecorder.start();
    } catch (error) {
      activeRecorder = null;
      recordingSession = null;
      recButton.disabled = false;
      stopButton.disabled = true;
      status.textContent = `録音を開始できませんでした: ${error.message}`;
    }
  });

  stopButton.addEventListener('click', async () => {
    if (!activeRecorder) return;
    stopButton.disabled = true;
    status.textContent = '録音を停止しています…';
    try {
      await activeRecorder.stop('stopped');
    } catch (error) {
      activeRecorder = null;
      recordingSession = null;
      recButton.disabled = false;
      status.textContent = `録音停止に失敗しました: ${error.message}`;
    }
  });

  root.addEventListener('click', async (event) => {
    const previewButton = event.target.closest('[data-preview-take]');
    const aButton = event.target.closest('[data-set-a]');
    const bButton = event.target.closest('[data-set-b]');
    const exportButton = event.target.closest('[data-export-take]');
    const deleteButton = event.target.closest('[data-delete-take]');

    try {
      if (previewButton) {
        const record = await loadToAudio(previewButton.dataset.previewTake, preview, 'preview');
        status.textContent = `${record.name}をPreviewへ読み込みました。`;
        await preview.play().catch(() => {});
      } else if (aButton) {
        const record = await loadToAudio(aButton.dataset.setA, aAudio, 'a');
        aLabel.textContent = record.name;
        status.textContent = `${record.name}をTake Aへセットしました。`;
      } else if (bButton) {
        const record = await loadToAudio(bButton.dataset.setB, bAudio, 'b');
        bLabel.textContent = record.name;
        status.textContent = `${record.name}をTake Bへセットしました。`;
      } else if (exportButton) {
        const record = await getSavedTake(exportButton.dataset.exportTake);
        if (!record) throw new Error('Takeが見つかりません。');
        const url = makeAudioUrl(record);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${safeFileName(record.name)}.${audioExtensionForMimeType(record.mimeType)}`;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
        status.textContent = `${record.name}を書き出しました。`;
      } else if (deleteButton) {
        if (!globalThis.confirm('この録音Takeを端末から削除します。よろしいですか？')) return;
        deleteButton.disabled = true;
        await deleteSavedTake(deleteButton.dataset.deleteTake);
        await refresh();
        status.textContent = '録音Takeを削除しました。';
      }
    } catch (error) {
      status.textContent = `Take操作に失敗しました: ${error.message}`;
    }
  });

  refresh().catch((error) => {
    status.textContent = `録音Take一覧を読み込めませんでした: ${error.message}`;
  });

  return Object.freeze({
    refresh,
    async destroy() {
      const recorderToDestroy = activeRecorder;
      recordingSession = null;
      activeRecorder = null;
      if (recorderToDestroy) await recorderToDestroy.destroy();
      revoke('preview');
      revoke('a');
      revoke('b');
    },
  });
}
