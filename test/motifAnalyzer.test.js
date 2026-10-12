import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeMotifs } from '../src/analysis/motif/index.js';

function note(pitch, startTick, durationTick = 240) {
  return { id: `n-${pitch}-${startTick}`, pitch, startTick, durationTick, velocity: 100, trackId: 'melody', channel: 0, origin: 'test' };
}

test('finds a repeated motif even when the second occurrence is transposed', () => {
  const song = {
    ppq: 480,
    lengthTicks: 3840,
    tracks: [{ id: 'melody', name: 'Melody', noteCount: 8, channels: [0], isDrums: false, roleHint: 'melody' }],
    notes: [
      note(60, 0), note(62, 480), note(64, 960), note(67, 1440),
      note(62, 1920), note(64, 2400), note(66, 2880), note(69, 3360),
    ],
  };

  const result = analyzeMotifs(song);
  assert.equal(result.trackId, 'melody');
  assert.ok(result.motifs.length >= 1);
  assert.equal(result.motifs[0].occurrenceCount, 2);
  assert.equal(result.motifs[0].noteLength, 4);
  assert.deepEqual(result.motifs[0].occurrences.map((item) => item.startTick), [0, 1920]);
});

test('returns no candidates when there are not enough notes for two occurrences', () => {
  const song = {
    ppq: 480,
    lengthTicks: 1000,
    tracks: [{ id: 'melody', name: 'Melody', noteCount: 4, channels: [0], isDrums: false, roleHint: 'melody' }],
    notes: [note(60, 0), note(62, 240), note(64, 480), note(65, 720)],
  };
  assert.equal(analyzeMotifs(song).motifs.length, 0);
});
