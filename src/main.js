import './styles.css';
import { importMidiFile } from './midi/index.js';
import { renderImportError, renderSongSummary } from './ui/renderImport.js';

const form = document.querySelector('#import-form');
const fileInput = document.querySelector('#midi-file');
const originSelect = document.querySelector('#midi-origin');
const resultRoot = document.querySelector('#result');
const submitButton = document.querySelector('#import-button');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const file = fileInput.files?.[0];

  if (!file) {
    renderImportError(resultRoot, new Error('MIDIファイルを選んでください。'));
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = '読み込み中…';

  try {
    const result = await importMidiFile(file, { origin: originSelect.value });
    renderSongSummary(resultRoot, result);
  } catch (error) {
    renderImportError(resultRoot, error);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'MIDIを読み込む';
  }
});
