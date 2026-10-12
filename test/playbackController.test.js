import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlaybackController } from '../src/playback/index.js';

class FakeAudioParam {
  calls = [];
  setValueAtTime(value, time) { this.calls.push(['set', value, time]); }
  linearRampToValueAtTime(value, time) { this.calls.push(['linear', value, time]); }
}

class FakeGain {
  gain = new FakeAudioParam();
  connections = [];
  connect(target) { this.connections.push(target); }
}

class FakeOscillator {
  frequency = new FakeAudioParam();
  connections = [];
  starts = [];
  stops = [];
  type = 'sine';
  onended = null;
  connect(target) { this.connections.push(target); }
  start(time) { this.starts.push(time); }
  stop(time) { this.stops.push(time); }
}

class FakeAudioContext {
  static instances = [];

  constructor() {
    this.currentTime = 0;
    this.state = 'suspended';
    this.destination = {};
    this.gains = [];
    this.oscillators = [];
    this.closed = false;
    FakeAudioContext.instances.push(this);
  }

  async resume() { this.state = 'running'; }
  async close() { this.state = 'closed'; this.closed = true; }
  createGain() { const gain = new FakeGain(); this.gains.push(gain); return gain; }
  createOscillator() { const oscillator = new FakeOscillator(); this.oscillators.push(oscillator); return oscillator; }
}

function makeSong(notes = [{
  id: 'n1', pitch: 60, startTick: 0, durationTick: 480, velocity: 100, channel: 0, trackId: 't1',
}]) {
  return {
    ppq: 480,
    tempoMap: [{ tick: 0, microsecondsPerBeat: 500000, bpm: 120 }],
    notes,
  };
}

test('play schedules Web Audio nodes and stop closes the AudioContext', async () => {
  FakeAudioContext.instances.length = 0;
  const states = [];
  let intervalCallback = null;
  let cleared = false;
  const controller = createPlaybackController(makeSong(), {
    AudioContextCtor: FakeAudioContext,
    setIntervalFn(callback) { intervalCallback = callback; return 7; },
    clearIntervalFn(id) { assert.equal(id, 7); cleared = true; },
    onStateChange(event) { states.push(event.state); },
  });

  await controller.play();
  const context = FakeAudioContext.instances[0];
  assert.equal(controller.isPlaying(), true);
  assert.equal(context.state, 'running');
  assert.equal(context.oscillators.length, 1);
  assert.equal(context.oscillators[0].starts.length, 1);
  assert.equal(typeof intervalCallback, 'function');
  assert.deepEqual(states, ['playing']);

  await controller.stop();
  assert.equal(controller.isPlaying(), false);
  assert.equal(context.closed, true);
  assert.equal(cleared, true);
  assert.deepEqual(states, ['playing', 'stopped']);
});

test('play rejects when the Song contains no playable notes', async () => {
  const controller = createPlaybackController(makeSong([]), {
    AudioContextCtor: FakeAudioContext,
  });
  await assert.rejects(controller.play(), /再生できるNote/);
});

test('stop during AudioContext resume cancels the pending playback session', async () => {
  let releaseResume;
  class SlowAudioContext extends FakeAudioContext {
    async resume() {
      await new Promise((resolve) => { releaseResume = resolve; });
      this.state = 'running';
    }
  }

  const states = [];
  const controller = createPlaybackController(makeSong(), {
    AudioContextCtor: SlowAudioContext,
    setIntervalFn() { return 1; },
    clearIntervalFn() {},
    onStateChange(event) { states.push(event.state); },
  });

  const playPromise = controller.play();
  await Promise.resolve();
  const stopPromise = controller.stop();
  releaseResume();
  await Promise.all([playPromise, stopPromise]);

  assert.equal(controller.isPlaying(), false);
  assert.equal(states.includes('playing'), false);
  assert.equal(states.includes('stopped'), true);
});
