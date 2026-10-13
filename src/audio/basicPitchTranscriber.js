const MODEL_SAMPLE_RATE = 22050;
const DEFAULT_CHUNK_SECONDS = 30;
const DEFAULT_OVERLAP_SECONDS = 1;
const MAX_AUDIO_SECONDS = 8 * 60;
const MAX_FILE_BYTES = 120 * 1024 * 1024;
const SUPPORTED_EXTENSIONS = ['wav', 'mp3', 'm4a', 'aac', 'flac', 'ogg', 'oga', 'webm'];

function abortError() {
  if (typeof DOMException === 'function') return new DOMException('Audio→MIDIをキャンセルしました。', 'AbortError');
  const error = new Error('Audio→MIDIをキャンセルしました。');
  error.name = 'AbortError';
  return error;
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw abortError();
}

function extensionOf(name = '') {
  return String(name).split('.').pop()?.toLowerCase() || '';
}

export function validateAudioFile(file) {
  if (!file) throw new Error('Audioファイルを選んでください。');
  if (Number(file.size) > MAX_FILE_BYTES) throw new Error('Audioファイルが大きすぎます。現在は120MB以下を対象にしています。');
  const extension = extensionOf(file.name);
  if (!SUPPORTED_EXTENSIONS.includes(extension) && !String(file.type || '').startsWith('audio/')) {
    throw new Error('WAV / MP3 / M4A / AAC / FLAC / OGG / WebM Audioを選んでください。');
  }
  return true;
}

async function decodeAudio(file, signal) {
  throwIfAborted(signal);
  const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioContextClass) throw new Error('このブラウザはWeb Audio APIに対応していません。');
  const context = new AudioContextClass();
  try {
    const bytes = await file.arrayBuffer();
    throwIfAborted(signal);
    const decoded = await context.decodeAudioData(bytes.slice(0));
    if (decoded.duration > MAX_AUDIO_SECONDS) {
      throw new Error('Androidのメモリ保護のため、現在は8分以内のAudioを対象にしています。');
    }
    return decoded;
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    if (error instanceof Error && error.message.includes('8分以内')) throw error;
    throw new Error(`Audioをデコードできませんでした。この端末で対応する形式か確認してください。 (${error?.message || 'decode error'})`);
  } finally {
    await context.close().catch(() => {});
  }
}

async function resampleToMono(buffer, signal) {
  throwIfAborted(signal);
  const OfflineContextClass = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
  if (!OfflineContextClass) throw new Error('このブラウザはOfflineAudioContextに対応していません。');
  const frameCount = Math.max(1, Math.ceil(buffer.duration * MODEL_SAMPLE_RATE));
  const offline = new OfflineContextClass(1, frameCount, MODEL_SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = buffer;
  source.connect(offline.destination);
  source.start(0);
  const rendered = await offline.startRendering();
  throwIfAborted(signal);
  return new Float32Array(rendered.getChannelData(0));
}

function deduplicateNotes(notes) {
  const sorted = [...notes].sort((a, b) => a.startTimeSeconds - b.startTimeSeconds || a.pitchMidi - b.pitchMidi);
  const output = [];
  for (const note of sorted) {
    if (!Number.isFinite(note.startTimeSeconds) || !Number.isFinite(note.durationSeconds)) continue;
    if (note.durationSeconds <= 0 || note.pitchMidi < 0 || note.pitchMidi > 127) continue;
    const duplicateIndex = output.findLastIndex((candidate) =>
      candidate.pitchMidi === note.pitchMidi &&
      Math.abs(candidate.startTimeSeconds - note.startTimeSeconds) <= 0.18
    );
    if (duplicateIndex >= 0) {
      const previous = output[duplicateIndex];
      const previousEnd = previous.startTimeSeconds + previous.durationSeconds;
      const nextEnd = note.startTimeSeconds + note.durationSeconds;
      output[duplicateIndex] = {
        ...previous,
        amplitude: Math.max(previous.amplitude || 0, note.amplitude || 0),
        durationSeconds: Math.max(previousEnd, nextEnd) - Math.min(previous.startTimeSeconds, note.startTimeSeconds),
        startTimeSeconds: Math.min(previous.startTimeSeconds, note.startTimeSeconds),
      };
      continue;
    }
    output.push(note);
  }
  return output;
}

function modelUrl() {
  return new URL('basic-pitch-model/model.json', document.baseURI).href;
}

export async function transcribeAudioFile(file, {
  signal,
  onProgress = () => {},
  chunkSeconds = DEFAULT_CHUNK_SECONDS,
  overlapSeconds = DEFAULT_OVERLAP_SECONDS,
  onsetThreshold = 0.25,
  frameThreshold = 0.25,
  minNoteLengthFrames = 5,
} = {}) {
  validateAudioFile(file);
  onProgress({ stage: 'decode', progress: 0, message: 'Audioを端末内でデコード中…' });
  const decoded = await decodeAudio(file, signal);
  throwIfAborted(signal);
  onProgress({ stage: 'resample', progress: 0.04, message: '22.05kHz / monoへ端末内で変換中…' });
  const samples = await resampleToMono(decoded, signal);
  throwIfAborted(signal);

  onProgress({ stage: 'model', progress: 0.08, message: 'Basic Pitchモデルを準備中…' });
  const {
    BasicPitch,
    addPitchBendsToNoteEvents,
    noteFramesToTime,
    outputToNotesPoly,
  } = await import('@spotify/basic-pitch');
  throwIfAborted(signal);
  const basicPitch = new BasicPitch(modelUrl());

  const chunkSamples = Math.max(MODEL_SAMPLE_RATE * 5, Math.round(chunkSeconds * MODEL_SAMPLE_RATE));
  const overlapSamples = Math.min(chunkSamples - 1, Math.max(0, Math.round(overlapSeconds * MODEL_SAMPLE_RATE)));
  const hopSamples = Math.max(1, chunkSamples - overlapSamples);
  const starts = [];
  for (let start = 0; start < samples.length; start += hopSamples) starts.push(start);

  const allNotes = [];
  for (let chunkIndex = 0; chunkIndex < starts.length; chunkIndex += 1) {
    throwIfAborted(signal);
    const startSample = starts[chunkIndex];
    const endSample = Math.min(samples.length, startSample + chunkSamples);
    const chunk = samples.slice(startSample, endSample);
    let frames = [];
    let onsets = [];
    let contours = [];

    await basicPitch.evaluateModel(
      chunk,
      (nextFrames, nextOnsets, nextContours) => {
        frames = nextFrames;
        onsets = nextOnsets;
        contours = nextContours;
      },
      (fraction) => {
        throwIfAborted(signal);
        const overall = 0.1 + 0.82 * ((chunkIndex + Math.max(0, Math.min(1, fraction))) / starts.length);
        onProgress({
          stage: 'inference',
          progress: overall,
          message: `Audio→MIDI変換中… ${Math.round(overall * 100)}%`,
        });
      },
    );

    throwIfAborted(signal);
    const frameNotes = outputToNotesPoly(frames, onsets, onsetThreshold, frameThreshold, minNoteLengthFrames);
    const pitchBendNotes = addPitchBendsToNoteEvents(contours, frameNotes);
    const timedNotes = noteFramesToTime(pitchBendNotes);
    const offset = startSample / MODEL_SAMPLE_RATE;
    for (const note of timedNotes) {
      allNotes.push({
        ...note,
        startTimeSeconds: Math.max(0, note.startTimeSeconds + offset),
      });
    }

    onProgress({
      stage: 'inference',
      progress: 0.1 + 0.82 * ((chunkIndex + 1) / starts.length),
      message: `Audio→MIDI変換中… ${Math.round((0.1 + 0.82 * ((chunkIndex + 1) / starts.length)) * 100)}%`,
    });
  }

  throwIfAborted(signal);
  const notes = deduplicateNotes(allNotes);
  onProgress({ stage: 'complete', progress: 1, message: `変換完了: ${notes.length} notes` });
  return Object.freeze({
    notes: Object.freeze(notes),
    durationSeconds: decoded.duration,
    sampleRate: MODEL_SAMPLE_RATE,
    source: Object.freeze({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || null,
      processedLocally: true,
      engine: '@spotify/basic-pitch@1.0.1',
    }),
  });
}

export const BASIC_PITCH_LIMITS = Object.freeze({
  maxAudioSeconds: MAX_AUDIO_SECONDS,
  maxFileBytes: MAX_FILE_BYTES,
  modelSampleRate: MODEL_SAMPLE_RATE,
  chunkSeconds: DEFAULT_CHUNK_SECONDS,
  overlapSeconds: DEFAULT_OVERLAP_SECONDS,
});
