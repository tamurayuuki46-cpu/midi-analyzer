import { buildPlaybackSchedule, midiPitchToFrequency } from '../playback/index.js';

const DEFAULT_LOOKAHEAD_SECONDS = 0.18;
const DEFAULT_INTERVAL_MS = 50;
const START_DELAY_SECONDS = 0.04;
const MIME_CANDIDATES = Object.freeze([
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
]);

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function defaultAudioContextCtor() {
  return globalThis.AudioContext ?? globalThis.webkitAudioContext ?? null;
}

function defaultMediaRecorderCtor() {
  return globalThis.MediaRecorder ?? null;
}

export function pickRecordingMimeType(MediaRecorderCtor = defaultMediaRecorderCtor()) {
  if (!MediaRecorderCtor) return '';
  if (typeof MediaRecorderCtor.isTypeSupported !== 'function') return '';
  return MIME_CANDIDATES.find((type) => MediaRecorderCtor.isTypeSupported(type)) ?? '';
}

export function isPartRecorderSupported(options = {}) {
  const AudioContextCtor = options.AudioContextCtor ?? defaultAudioContextCtor();
  const MediaRecorderCtor = options.MediaRecorderCtor ?? defaultMediaRecorderCtor();
  return Boolean(AudioContextCtor && MediaRecorderCtor);
}

function createMasterGain(context, mediaDestination, monitor) {
  const master = context.createGain();
  master.gain.setValueAtTime(0.28, context.currentTime);
  master.connect(mediaDestination);
  if (monitor) master.connect(context.destination);
  return master;
}

function schedulePitchedNote(context, destination, event, absoluteStart, absoluteEnd, activeNodes) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const velocity = clamp(Number(event.velocity) || 96, 1, 127) / 127;
  const level = 0.055 * velocity;
  const attackEnd = Math.min(absoluteStart + 0.008, absoluteEnd);
  const releaseStart = Math.max(attackEnd, absoluteEnd - 0.018);

  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(midiPitchToFrequency(event.pitch), absoluteStart);
  gain.gain.setValueAtTime(0, absoluteStart);
  gain.gain.linearRampToValueAtTime(level, attackEnd);
  gain.gain.setValueAtTime(level, releaseStart);
  gain.gain.linearRampToValueAtTime(0, absoluteEnd);

  oscillator.connect(gain);
  gain.connect(destination);
  activeNodes.add(oscillator);
  oscillator.onended = () => activeNodes.delete(oscillator);
  oscillator.start(absoluteStart);
  oscillator.stop(absoluteEnd + 0.005);
}

function scheduleDrumClick(context, destination, event, absoluteStart, activeNodes) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const velocity = clamp(Number(event.velocity) || 96, 1, 127) / 127;
  const end = absoluteStart + 0.045;
  const frequency = 110 + (Number(event.pitch) % 24) * 8;

  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(frequency, absoluteStart);
  gain.gain.setValueAtTime(0.035 * velocity, absoluteStart);
  gain.gain.linearRampToValueAtTime(0, end);

  oscillator.connect(gain);
  gain.connect(destination);
  activeNodes.add(oscillator);
  oscillator.onended = () => activeNodes.delete(oscillator);
  oscillator.start(absoluteStart);
  oscillator.stop(end + 0.005);
}

export function createPartRecorderController(song, options = {}) {
  const schedule = buildPlaybackSchedule(song);
  const AudioContextCtor = options.AudioContextCtor ?? defaultAudioContextCtor();
  const MediaRecorderCtor = options.MediaRecorderCtor ?? defaultMediaRecorderCtor();
  const BlobCtor = options.BlobCtor ?? globalThis.Blob;
  const setIntervalFn = options.setIntervalFn ?? globalThis.setInterval?.bind(globalThis);
  const clearIntervalFn = options.clearIntervalFn ?? globalThis.clearInterval?.bind(globalThis);
  const onStateChange = options.onStateChange ?? (() => {});
  const onComplete = options.onComplete ?? (() => {});
  const monitor = options.monitor !== false;
  const lookaheadSeconds = options.lookaheadSeconds ?? DEFAULT_LOOKAHEAD_SECONDS;
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const durationSeconds = schedule.length ? Math.max(...schedule.map((event) => event.endSeconds)) : 0;

  let context = null;
  let recorder = null;
  let masterGain = null;
  let timerId = null;
  let nextIndex = 0;
  let startAudioTime = 0;
  let recording = false;
  let starting = false;
  let sessionId = 0;
  let chunks = [];
  let recordedDurationSeconds = 0;
  let recorderFinished = null;
  let resolveRecorder = null;
  let rejectRecorder = null;
  let stopPromise = null;
  const activeNodes = new Set();

  function emit(state, detail = {}) {
    onStateChange(Object.freeze({ state, ...detail }));
  }

  function clearTimer() {
    if (timerId !== null && clearIntervalFn) clearIntervalFn(timerId);
    timerId = null;
  }

  async function closeContext(currentContext) {
    if (!currentContext || currentContext.state === 'closed') return;
    try {
      await currentContext.close?.();
    } catch {
      // Recording result is already finalized; closing errors are non-fatal.
    }
  }

  function scheduleEvent(event) {
    if (!context || !masterGain) return;
    const now = context.currentTime;
    const absoluteStart = Math.max(now + 0.002, startAudioTime + event.startSeconds);
    const intendedEnd = startAudioTime + event.endSeconds;
    const absoluteEnd = Math.max(absoluteStart + 0.02, intendedEnd);

    if (event.isDrums) scheduleDrumClick(context, masterGain, event, absoluteStart, activeNodes);
    else schedulePitchedNote(context, masterGain, event, absoluteStart, absoluteEnd, activeNodes);
  }

  function scheduler(activeSessionId) {
    if (!recording || !context || activeSessionId !== sessionId) return;
    const elapsed = Math.max(0, context.currentTime - startAudioTime);
    const scheduleUntil = elapsed + lookaheadSeconds;

    while (nextIndex < schedule.length && schedule[nextIndex].startSeconds <= scheduleUntil) {
      scheduleEvent(schedule[nextIndex]);
      nextIndex += 1;
    }

    if (nextIndex >= schedule.length && elapsed >= durationSeconds + 0.08) {
      void stop('ended');
    }
  }

  async function start() {
    if (recording || starting) return;
    if (!AudioContextCtor || !MediaRecorderCtor || !BlobCtor) {
      throw new Error('このブラウザは分離録音に必要なWeb Audio / MediaRecorderに対応していません。');
    }
    if (!schedule.length) throw new Error('録音できるNoteがありません。');

    const activeSessionId = sessionId + 1;
    sessionId = activeSessionId;
    starting = true;
    stopPromise = null;
    chunks = [];
    recordedDurationSeconds = 0;
    const nextContext = new AudioContextCtor();
    context = nextContext;

    try {
      if (nextContext.state === 'suspended') await nextContext.resume?.();
      if (activeSessionId !== sessionId || context !== nextContext) {
        await closeContext(nextContext);
        return;
      }
      if (typeof nextContext.createMediaStreamDestination !== 'function') {
        throw new Error('このブラウザはWeb Audio録音出力に対応していません。');
      }

      const mediaDestination = nextContext.createMediaStreamDestination();
      masterGain = createMasterGain(nextContext, mediaDestination, monitor);
      const mimeType = pickRecordingMimeType(MediaRecorderCtor);
      recorder = mimeType
        ? new MediaRecorderCtor(mediaDestination.stream, { mimeType })
        : new MediaRecorderCtor(mediaDestination.stream);

      recorderFinished = new Promise((resolve, reject) => {
        resolveRecorder = resolve;
        rejectRecorder = reject;
      });
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunks.push(event.data);
      };
      recorder.onerror = (event) => {
        rejectRecorder?.(event.error ?? new Error('Audio録音に失敗しました。'));
      };
      recorder.onstop = () => {
        const finalType = recorder?.mimeType || mimeType || 'audio/webm';
        const blob = new BlobCtor(chunks, { type: finalType });
        resolveRecorder?.({
          blob,
          mimeType: finalType,
          durationSeconds: recordedDurationSeconds,
          eventCount: schedule.length,
        });
      };

      recorder.start();
      nextIndex = 0;
      startAudioTime = nextContext.currentTime + START_DELAY_SECONDS;
      recording = true;
      emit('recording', { durationSeconds, eventCount: schedule.length, monitor });
      scheduler(activeSessionId);
      if (setIntervalFn) timerId = setIntervalFn(() => scheduler(activeSessionId), intervalMs);
    } catch (error) {
      if (context === nextContext) {
        context = null;
        masterGain = null;
        recorder = null;
      }
      await closeContext(nextContext);
      throw error;
    } finally {
      if (activeSessionId === sessionId) starting = false;
    }
  }

  async function stop(reason = 'stopped') {
    if (stopPromise) return stopPromise;
    stopPromise = (async () => {
      const currentContext = context;
      const currentRecorder = recorder;
      const currentFinished = recorderFinished;
      sessionId += 1;
      clearTimer();

      if (currentContext) {
        recordedDurationSeconds = Math.max(0, Math.min(durationSeconds, currentContext.currentTime - startAudioTime));
      }
      recording = false;
      starting = false;
      nextIndex = 0;

      for (const node of activeNodes) {
        try {
          node.stop?.();
        } catch {
          // Node may already have ended.
        }
      }
      activeNodes.clear();

      try {
        if (currentRecorder && currentRecorder.state !== 'inactive') currentRecorder.stop();
        const result = currentFinished ? await currentFinished : null;
        if (result) {
          emit(reason, { durationSeconds: result.durationSeconds, size: result.blob.size });
          onComplete(result);
        } else {
          emit(reason, { durationSeconds: recordedDurationSeconds });
        }
        return result;
      } finally {
        context = null;
        recorder = null;
        masterGain = null;
        recorderFinished = null;
        resolveRecorder = null;
        rejectRecorder = null;
        await closeContext(currentContext);
      }
    })();

    try {
      return await stopPromise;
    } finally {
      stopPromise = null;
    }
  }

  return Object.freeze({
    start,
    stop,
    destroy: () => stop('destroyed'),
    isRecording: () => recording,
    getDurationSeconds: () => durationSeconds,
    getEventCount: () => schedule.length,
  });
}
