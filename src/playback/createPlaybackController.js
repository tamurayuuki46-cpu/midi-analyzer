import { buildPlaybackSchedule, midiPitchToFrequency } from './buildPlaybackSchedule.js';

const DEFAULT_LOOKAHEAD_SECONDS = 0.18;
const DEFAULT_INTERVAL_MS = 50;
const START_DELAY_SECONDS = 0.04;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function defaultAudioContextCtor() {
  return globalThis.AudioContext ?? globalThis.webkitAudioContext ?? null;
}

function createMasterGain(context) {
  const master = context.createGain();
  master.gain.setValueAtTime(0.28, context.currentTime);
  master.connect(context.destination);
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

export function isWebAudioSupported() {
  return Boolean(defaultAudioContextCtor());
}

export function createPlaybackController(song, options = {}) {
  const schedule = buildPlaybackSchedule(song);
  const AudioContextCtor = options.AudioContextCtor ?? defaultAudioContextCtor();
  const setIntervalFn = options.setIntervalFn ?? globalThis.setInterval?.bind(globalThis);
  const clearIntervalFn = options.clearIntervalFn ?? globalThis.clearInterval?.bind(globalThis);
  const onStateChange = options.onStateChange ?? (() => {});
  const lookaheadSeconds = options.lookaheadSeconds ?? DEFAULT_LOOKAHEAD_SECONDS;
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;
  const durationSeconds = schedule.length ? Math.max(...schedule.map((event) => event.endSeconds)) : 0;

  let context = null;
  let masterGain = null;
  let timerId = null;
  let nextIndex = 0;
  let startAudioTime = 0;
  let playing = false;
  let sessionId = 0;
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
      // Some browsers may reject close while transitioning; playback state is already cleared.
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

  async function stop(reason = 'stopped') {
    const currentContext = context;
    sessionId += 1;
    playing = false;
    nextIndex = 0;
    clearTimer();

    for (const node of activeNodes) {
      try {
        node.stop?.();
      } catch {
        // Node may already have ended.
      }
    }
    activeNodes.clear();
    context = null;
    masterGain = null;
    emit(reason, { durationSeconds });
    await closeContext(currentContext);
  }

  function scheduler(activeSessionId) {
    if (!playing || !context || activeSessionId !== sessionId) return;
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

  async function play() {
    if (playing) return;
    if (!AudioContextCtor) throw new Error('このブラウザはWeb Audio再生に対応していません。');
    if (!schedule.length) throw new Error('再生できるNoteがありません。');

    const activeSessionId = sessionId + 1;
    sessionId = activeSessionId;
    context = new AudioContextCtor();
    if (context.state === 'suspended') await context.resume?.();
    masterGain = createMasterGain(context);
    nextIndex = 0;
    startAudioTime = context.currentTime + START_DELAY_SECONDS;
    playing = true;
    emit('playing', { durationSeconds });
    scheduler(activeSessionId);

    if (setIntervalFn) {
      timerId = setIntervalFn(() => scheduler(activeSessionId), intervalMs);
    }
  }

  return Object.freeze({
    play,
    stop,
    destroy: () => stop('destroyed'),
    isPlaying: () => playing,
    getDurationSeconds: () => durationSeconds,
    getEventCount: () => schedule.length,
  });
}
