import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPlaybackSchedule,
  buildTempoSegments,
  createTickToSeconds,
  midiPitchToFrequency,
  playbackDurationSeconds,
} from '../src/playback/index.js';

function song(extra = {}) {
  return {
    ppq: 480,
    tempoMap: [{ tick: 0, microsecondsPerBeat: 500000, bpm: 120 }],
    notes: [],
    ...extra,
  };
}

function note(id, pitch, startTick, durationTick, velocity = 96, channel = 0) {
  return { id, pitch, startTick, durationTick, velocity, channel, trackId: 'track-1' };
}

test('tick conversion at 120 BPM maps one quarter note to 0.5 seconds', () => {
  const toSeconds = createTickToSeconds(song());
  assert.equal(toSeconds(0), 0);
  assert.equal(toSeconds(480), 0.5);
  assert.equal(toSeconds(960), 1);
});

test('tempo changes accumulate elapsed time correctly', () => {
  const input = song({
    tempoMap: [
      { tick: 0, microsecondsPerBeat: 500000, bpm: 120 },
      { tick: 480, microsecondsPerBeat: 1000000, bpm: 60 },
    ],
  });
  const segments = buildTempoSegments(input);
  const toSeconds = createTickToSeconds(input);
  assert.deepEqual(segments.map(({ tick, secondsAtTick }) => ({ tick, secondsAtTick })), [
    { tick: 0, secondsAtTick: 0 },
    { tick: 480, secondsAtTick: 0.5 },
  ]);
  assert.equal(toSeconds(960), 1.5);
});

test('missing tempo at tick zero receives the Standard MIDI 120 BPM default', () => {
  const toSeconds = createTickToSeconds(song({ tempoMap: [] }));
  assert.equal(toSeconds(480), 0.5);
});

test('duplicate tempo events at the same tick use the last event', () => {
  const toSeconds = createTickToSeconds(song({
    tempoMap: [
      { tick: 0, microsecondsPerBeat: 600000, bpm: 100 },
      { tick: 0, microsecondsPerBeat: 500000, bpm: 120 },
    ],
  }));
  assert.equal(toSeconds(480), 0.5);
});

test('playback schedule applies tempo map to note start and end', () => {
  const input = song({
    tempoMap: [
      { tick: 0, microsecondsPerBeat: 500000, bpm: 120 },
      { tick: 480, microsecondsPerBeat: 1000000, bpm: 60 },
    ],
    notes: [note('n1', 60, 240, 480)],
  });
  const [event] = buildPlaybackSchedule(input);
  assert.equal(event.startSeconds, 0.25);
  assert.equal(event.endSeconds, 1);
});

test('playback schedule sorts by time and marks Channel 10 as drums', () => {
  const input = song({
    notes: [
      note('later', 64, 480, 240),
      note('drum', 36, 0, 120, 127, 9),
      note('first', 60, 0, 240),
    ],
  });
  const events = buildPlaybackSchedule(input);
  assert.deepEqual(events.map((event) => event.id), ['drum', 'first', 'later']);
  assert.equal(events[0].isDrums, true);
  assert.equal(events[1].isDrums, false);
});

test('invalid zero-duration notes are excluded from playback', () => {
  const input = song({ notes: [note('bad', 60, 0, 0), note('good', 64, 480, 240)] });
  assert.deepEqual(buildPlaybackSchedule(input).map((event) => event.id), ['good']);
});

test('playback duration uses the last scheduled note end', () => {
  const input = song({
    notes: [note('a', 60, 0, 240), note('b', 64, 480, 480)],
  });
  assert.equal(playbackDurationSeconds(input), 1);
});

test('MIDI A4 is 440 Hz', () => {
  assert.equal(midiPitchToFrequency(69), 440);
  assert.ok(Math.abs(midiPitchToFrequency(60) - 261.625565) < 0.001);
});
