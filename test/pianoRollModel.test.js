import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTimelineMarkers,
  formatMidiNoteName,
  getDefaultTrackId,
  getPitchRange,
  getTrackNotes,
} from '../src/piano-roll/model.js';

test('getTrackNotes filters and sorts notes', () => {
  const song = { notes: [
    { trackId: 'b', startTick: 0, pitch: 40, durationTick: 10 },
    { trackId: 'a', startTick: 20, pitch: 64, durationTick: 10 },
    { trackId: 'a', startTick: 0, pitch: 67, durationTick: 10 },
  ]};
  assert.deepEqual(getTrackNotes(song, 'a').map((n) => n.pitch), [67, 64]);
});

test('getDefaultTrackId prefers a non-drum track with notes', () => {
  const song = { tracks: [
    { id: 'd', noteCount: 12, isDrums: true },
    { id: 'e', noteCount: 0, isDrums: false },
    { id: 'm', noteCount: 3, isDrums: false },
  ]};
  assert.equal(getDefaultTrackId(song), 'm');
});

test('getPitchRange pads and guarantees a useful minimum span', () => {
  const range = getPitchRange([{ pitch: 60 }, { pitch: 62 }]);
  assert.ok(range.minPitch <= 58);
  assert.ok(range.maxPitch >= 64);
  assert.ok(range.maxPitch - range.minPitch + 1 >= 12);
});

test('getPitchRange stays inside MIDI pitch bounds', () => {
  assert.deepEqual(getPitchRange([{ pitch: 0 }], { padding: 4, minimumSpan: 12 }), { minPitch: 0, maxPitch: 11 });
  assert.deepEqual(getPitchRange([{ pitch: 127 }], { padding: 4, minimumSpan: 12 }), { minPitch: 116, maxPitch: 127 });
});

test('buildTimelineMarkers makes bar and beat markers for 4/4', () => {
  const markers = buildTimelineMarkers({
    ppq: 480,
    lengthTicks: 3840,
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
  });
  assert.deepEqual(markers.filter((m) => m.kind === 'bar').map((m) => m.tick), [0, 1920]);
  assert.equal(markers.filter((m) => m.kind === 'beat').length, 6);
});

test('formatMidiNoteName uses scientific pitch notation', () => {
  assert.equal(formatMidiNoteName(60), 'C4');
  assert.equal(formatMidiNoteName(69), 'A4');
});

test('buildTimelineMarkers restarts a bar at a time-signature change', () => {
  const markers = buildTimelineMarkers({
    ppq: 480,
    lengthTicks: 3360,
    timeSignatures: [
      { tick: 0, numerator: 4, denominator: 4 },
      { tick: 1920, numerator: 3, denominator: 4 },
    ],
  });
  assert.deepEqual(markers.filter((m) => m.kind === 'bar').map((m) => m.tick), [0, 1920]);
});
