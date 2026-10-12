import './styles.css';
import { importMidiFile } from './midi/index.js';
import {
  deleteSavedMidi,
  isIndexedDbAvailable,
  listSavedMidis,
  saveImportedMidi,
} from './storage/index.js';
import { renderImportError, renderSongSummary } from './ui/renderImport.js';
import {
  renderSavedMidiList,
  renderStorageError,
  renderStorageUnavailable,
} from './ui/renderSavedMidis.js';

const form = document.querySelector('#import-form');
const fileInput = document.querySelector('#midi-file');
const originSelect = document.querySelector('#midi-origin');
const saveCheckbox = document.querySelector('#save-midi');
const resultRoot = document.querySelector('#result');
const savedRoot = document.querySelector('#saved-midi-list');
const storageStatus = document.querySelector('#storage-status');
const submitButton = document.querySelector('#import-button');

function setStorageStatus(message, tone = 'neutral') {
  storageStatus.textContent = message;
  storageStatus.dataset.tone = tone;
}

async function refreshSavedMidiList() {
  if (!isIndexedDbAvailable()) {
    saveCheckbox.checked = false;
    saveCheckbox.disabled = true;
    renderStorageUnavailable(savedRoot);
    return;
  }

  try {
    const items = await listSavedMidis();
    renderSavedMidiList(savedRoot, items);
  } catch (error) {
    renderStorageError(savedRoot, error);
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const file = fileInput.files?.[0];

  if (!file) {
    renderImportError(resultRoot, new Error('MIDIファイルを選んでください。'));
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = '読み込み中…';
  setStorageStatus('');

  try {
    const result = await importMidiFile(file, { origin: originSelect.value });
    renderSongSummary(resultRoot, result);

    if (saveCheckbox.checked) {
      try {
        await saveImportedMidi({
          file,
          importResult: result,
          origin: originSelect.value,
        });
        setStorageStatus('この端末に保存しました。クラウドや外部サービスには送信していません。', 'success');
        await refreshSavedMidiList();
      } catch (storageError) {
        setStorageStatus(`MIDIは読み込めましたが、端末保存に失敗しました: ${storageError.message}`, 'error');
      }
    } else {
      setStorageStatus('保存せずに読み込みました。ページを閉じると元MIDIデータは保持されません。', 'neutral');
    }
  } catch (error) {
    renderImportError(resultRoot, error);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'MIDIを読み込む';
  }
});

savedRoot.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-delete-midi]');
  if (!button) return;

  const id = button.dataset.deleteMidi;
  const confirmed = globalThis.confirm('この端末から保存済みMIDIを削除します。よろしいですか？');
  if (!confirmed) return;

  button.disabled = true;
  try {
    await deleteSavedMidi(id);
    setStorageStatus('保存済みMIDIをこの端末から削除しました。', 'success');
    await refreshSavedMidiList();
  } catch (error) {
    setStorageStatus(`削除できませんでした: ${error.message}`, 'error');
    button.disabled = false;
  }
});

refreshSavedMidiList();
