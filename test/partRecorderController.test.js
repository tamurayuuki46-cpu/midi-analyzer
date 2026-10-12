import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPartRecorderController,
  isPartRecorderSupported,
  pickRecordingMimeType,
} from '../src/recording/createPartRecorder.js';

class FakeParam {
  setValueAtTime() {}
  linearRampToValueAtTime() {}
}

class FakeNode {
  constructor() {
    this.gain = new FakeParam();
    this.frequency = new FakeParam();
    this.onended = null;
  }
  connect() {}
  start() {}
  stop() { this.onended?.(); }
}

class FakeAudioContext {
  constructor() {
    this.currentTime = 0;
    this.state = 'running';
    this.destination = {};
  }
  createGain() { return new FakeNode(); }
  createOscillator() { return new FakeNode(); }
  createMediaStreamDestination() { return { stream: {} }; }
  async close() { this.state = 'closed'; }
}

class FakeMediaRecorder {
  static isTypeSupported(type) { return type.startsWith('audio/webm'); }
  constructor(_stream, options = {}) {
    this.state = 'inactive';
    this.mimeType = options.mimeType || 'audio/webm';
    this.ondataavailable = null;
    this.onstop = null;
    this.onerror = null;
  }
  start() { this.state = 'recording'; }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob([Uint8Array.from([7, 8, 9])], { type: this.mimeType }) });
    this.onstop?.();
  }
}

function makeSong() {
  return {
    schemaVersion: '0.1',
    source: { fileName: 'take.mid', origin: 'midi' },
    ppq: 480,
    tempoMap: [{ tick: 0, bpm: 120 }],
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
    lengthTicks: 480,
    tracks: [{ id: 'mel', name: 'Lead', channels: [0], noteCount: 1, isDrums: false, roleHint: 'melody' }],
    notes: [{ id: 'n1', pitch: 72, startTick: 0, durationTick: 480, velocity: 100, trackId: 'mel', channel: 0, origin: 'midi' }],
  };
}

test('recorder support and MIME selection can be feature-detected', () => {
  assert.equal(isPartRecorderSupported({ AudioContextCtor: FakeAudioContext, MediaRecorderCtor: FakeMediaRecorder }), true);
  assert.equal(pickRecordingMimeType(FakeMediaRecorder), 'audio/webm;codecs=opus');
});

test('part recorder starts and returns captured audio on stop', async () => {
  const states = [];
  const controller = createPartRecorderController(makeSong(), {
    AudioContextCtor: FakeAudioContext,
    MediaRecorderCtor: FakeMediaRecorder,
    BlobCtor: Blob,
    setIntervalFn: () => 1,
    clearIntervalFn: () => {},
    onStateChange: (state) => states.push(state.state),
  });

  await controller.start();
  assert.equal(controller.isRecording(), true);
  const result = await controller.stop('stopped');
  assert.equal(controller.isRecording(), false);
  assert.equal(result.mimeType, 'audio/webm;codecs=opus');
  assert.equal(result.blob.size, 3);
  assert.deepEqual(states, ['recording', 'stopped']);
});
