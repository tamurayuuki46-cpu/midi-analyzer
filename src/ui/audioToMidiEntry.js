import './songDataMenuEntry.js';
import { transcribeAudioFile } from '../audio/basicPitchTranscriber.js';
import { noteEventsToMidi } from '../audio/noteEventsToMidi.js';
import { updateStemStatus } from '../storage/stemStore.js';

const root = document.querySelector('#audio-to-midi-root');
const midiInput = document.querySelector('#midi-file');
const midiOrigin = document.querySelector('#midi-origin');
const midiForm = document.querySelector('#import-form');

let activeController = null;
let lastMidiFile = null;

function safeName(value) {
  return String(value || 'audio').replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 80) || 'audio';
}

function formatTime(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function downloadFile(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

function setGeneratedMidi(file) {
  if (!midiInput || typeof DataTransfer !== 'function') return false;
  const transfer = new DataTransfer();
  transfer.items.add(file);
  midiInput.files = transfer.files;
  if (midiOrigin?.querySelector('option[value="basic-pitch"]')) midiOrigin.value = 'basic-pitch';
  return true;
}

function render() {
  if (!root) return;
  root.innerHTML = `
    <section class="panel" aria-labelledby="audio-midi-title">
      <div class="panel-heading">
        <div><p class="eyebrow">AUDIO → MIDI · LOCAL</p><h2 id="audio-midi-title">Basic PitchでAudioをMIDI化</h2></div>
      </div>
      <p class="helper-note">WAV / MP3 / M4Aなど、Android ChromeがデコードできるAudioを端末内で処理します。Audio本体を自動で外部送信しません。処理する権利のある音源を選んでください。</p>
      <form data-audio-midi-form class="form-stack">
        <div class="field">
          <label for="audio-midi-file">Audioファイル</label>
          <input id="audio-midi-file" data-audio-file type="file" accept="audio/*,.wav,.mp3,.m4a,.aac,.flac,.ogg,.oga,.webm" required>
          <small>現在は8分 / 120MB以下。長い曲は30秒単位で分割推論してAndroidのピークメモリを抑えます。</small>
        </div>
        <div class="field">
          <label for="audio-midi-bpm">MIDIの基準BPM</label>
          <input id="audio-midi-bpm" data-audio-bpm type="number" min="20" max="300" step="1" value="120">
          <small>Noteの秒数をMIDI tickへ置き換える基準です。Key / Chord解析は変換後のMIDIから行います。</small>
        </div>
        <div class="button-row">
          <button data-audio-convert class="primary-button" type="submit">Audio→MIDIを開始</button>
          <button data-audio-cancel type="button" disabled>キャンセル</button>
          <button data-audio-download type="button" disabled>変換MIDIを保存</button>
        </div>
        <progress data-audio-progress max="1" value="0" hidden></progress>
        <p data-audio-status class="storage-status" aria-live="polite"></p>
      </form>
    </section>
  `;

  const form = root.querySelector('[data-audio-midi-form]');
  const fileInput = root.querySelector('[data-audio-file]');
  const bpmInput = root.querySelector('[data-audio-bpm]');
  const convertButton = root.querySelector('[data-audio-convert]');
  const cancelButton = root.querySelector('[data-audio-cancel]');
  const downloadButton = root.querySelector('[data-audio-download]');
  const progress = root.querySelector('[data-audio-progress]');
  const status = root.querySelector('[data-audio-status]');

  cancelButton.addEventListener('click', () => activeController?.abort());
  downloadButton.addEventListener('click', () => {
    if (lastMidiFile) downloadFile(lastMidiFile);
  });

  async function convert(audioFile, context = {}) {
    if (!audioFile) throw new Error('Audioファイルがありません。');

    activeController?.abort();
    activeController = new AbortController();
    const controller = activeController;
    convertButton.disabled = true;
    cancelButton.disabled = false;
    downloadButton.disabled = true;
    progress.hidden = false;
    progress.value = 0;
    status.dataset.tone = 'neutral';
    lastMidiFile = null;

    try {
      const result = await transcribeAudioFile(audioFile, {
        signal: controller.signal,
        onProgress(update) {
          progress.value = Math.max(0, Math.min(1, Number(update.progress) || 0));
          status.textContent = `${context.stemName ? `${context.stemName}: ` : ''}${update.message || '処理中…'}`;
        },
      });
      if (controller.signal.aborted) return;

      const bpm = Math.max(20, Math.min(300, Number(bpmInput.value) || 120));
      const midiBytes = noteEventsToMidi(result.notes, {
        bpm,
        ppq: 480,
        trackName: `Basic Pitch ${safeName(audioFile.name)}`,
      });
      const fileName = `${safeName(audioFile.name)}_basic_pitch.mid`;
      lastMidiFile = new File([midiBytes], fileName, { type: 'audio/midi' });
      downloadButton.disabled = false;
      status.dataset.tone = 'success';
      status.textContent = `変換完了: ${result.notes.length} notes / ${formatTime(result.durationSeconds)}。既存MIDI Analyzerへ渡します。`;

      if (context.stemId) {
        await updateStemStatus(context.stemId, {
          conversionStatus: 'converted',
          analysisStatus: 'midi-generated',
        });
        window.dispatchEvent(new CustomEvent('stem-status-changed', { detail: { stemId: context.stemId } }));
      }

      window.dispatchEvent(new CustomEvent('basic-pitch-notes-ready', {
        detail: {
          notes: result.notes,
          bpm,
          fileName: audioFile.name,
          stemId: context.stemId || null,
          stemType: context.stemType || null,
        },
      }));

      if (setGeneratedMidi(lastMidiFile) && midiForm) {
        midiForm.requestSubmit();
      } else {
        status.textContent += ' このブラウザでは自動受け渡しできないため「変換MIDIを保存」を使ってください。';
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        status.dataset.tone = 'neutral';
        status.textContent = 'Audio→MIDIをキャンセルしました。Audioは外部送信していません。';
      } else {
        if (context.stemId) {
          try {
            await updateStemStatus(context.stemId, { conversionStatus: 'failed' });
            window.dispatchEvent(new CustomEvent('stem-status-changed', { detail: { stemId: context.stemId } }));
          } catch {}
        }
        status.dataset.tone = 'error';
        status.textContent = `Audio→MIDIに失敗しました: ${error?.message || 'unknown error'}`;
      }
    } finally {
      if (activeController === controller) activeController = null;
      convertButton.disabled = false;
      cancelButton.disabled = true;
      if (!lastMidiFile) progress.value = 0;
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const audioFile = fileInput.files?.[0];
    if (!audioFile) {
      status.textContent = 'Audioファイルを選んでください。';
      status.dataset.tone = 'error';
      return;
    }
    await convert(audioFile);
  });

  window.addEventListener('stem-basic-pitch-request', async (event) => {
    const detail = event.detail || {};
    if (!detail.file) return;
    status.dataset.tone = 'neutral';
    status.textContent = `${detail.stemName || 'Stem'} をBasic Pitchで変換します。`;
    await convert(detail.file, detail);
  });
}

render();
