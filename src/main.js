import './styles.css';
import { analyzeKeyScale } from './analysis/key/index.js';
import { importMidiFile } from './midi/index.js';
import { mountPianoRoll } from './piano-roll/index.js';
import {
  deleteSavedMidi,
  getSavedMidi,
  isIndexedDbAvailable,
  listSavedMidis,
  saveImportedMidi,
} from './storage/index.js';
import { mountAdvancedAnalysis } from './ui/renderAdvancedAnalysis.js';
import { mountBasicAnalysis } from './ui/renderBasicAnalysis.js';
import { mountChordAnalysis } from './ui/renderChordAnalysis.js';
import { mountCompareAnalysis } from './ui/renderCompareAnalysis.js';
import { renderImportError, renderSongSummary } from './ui/renderImport.js';
import { mountKeyAnalysis } from './ui/renderKeyAnalysis.js';
import { mountPlayback } from './ui/renderPlayback.js';
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

let activePlaybackController = null;
let activeCompareController = null;

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

async function loadSavedSongs() {
  if (!isIndexedDbAvailable()) return [];
  const items = await listSavedMidis();
  const records = await Promise.all(items.map((item) => getSavedMidi(item.id)));
  return records.map((record) => record?.song).filter(Boolean);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const file = fileInput.files?.[0];

  if (!file) {
    renderImportError(resultRoot, new Error('MIDIファイルを選んでください。'));
    return;
  }

  if (activePlaybackController) {
    await activePlaybackController.destroy();
    activePlaybackController = null;
  }
  activeCompareController = null;

  submitButton.disabled = true;
  submitButton.textContent = '読み込み中…';
  setStorageStatus('');

  try {
    const result = await importMidiFile(file, { origin: originSelect.value });
    const keyAnalysis = analyzeKeyScale(result.song);
    renderSongSummary(resultRoot, result);

    activePlaybackController = mountPlayback(resultRoot.querySelector('[data-playback-root]'), result.song);

    const keyRoot = resultRoot.querySelector('[data-key-analysis-root]');
    const chordRoot = resultRoot.querySelector('[data-chord-analysis-root]');
    const keyController = mountKeyAnalysis(keyRoot, keyAnalysis);
    const chordController = mountChordAnalysis(
      chordRoot,
      result.song,
      {
        getEffectiveKey: keyController?.getEffectiveKey,
        isKeyExplicit: () => Boolean(keyController?.getSelected()),
      },
    );
    const basicController = mountBasicAnalysis(
      resultRoot.querySelector('[data-basic-analysis-root]'),
      result.song,
      {
        getChordSegments: chordController?.getEffectiveSegments,
      },
    );

    mountAdvancedAnalysis(resultRoot.querySelector('[data-advanced-analysis-root]'), result.song);
    activeCompareController = mountCompareAnalysis(
      resultRoot.querySelector('[data-compare-analysis-root]'),
      result.song,
      { loadSavedSongs },
    );

    keyRoot?.addEventListener('key-selection-change', () => chordController?.refreshKeyContext());
    chordRoot?.addEventListener('chord-selection-change', () => basicController?.refreshChordContext());
    chordRoot?.addEventListener('chord-analysis-change', () => basicController?.refreshChordContext());

    mountPianoRoll(resultRoot.querySelector('[data-piano-roll-root]'), result.song);

    if (saveCheckbox.checked) {
      try {
        await saveImportedMidi({
          file,
          importResult: result,
          origin: originSelect.value,
        });
        setStorageStatus('この端末に保存しました。クラウドや外部サービスには送信していません。', 'success');
        await refreshSavedMidiList();
        await activeCompareController?.refreshTrend();
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
    await activeCompareController?.refreshTrend();
  } catch (error) {
    setStorageStatus(`削除できませんでした: ${error.message}`, 'error');
    button.disabled = false;
  }
});

refreshSavedMidiList();
