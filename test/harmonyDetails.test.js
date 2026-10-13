import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeHarmonyDetails } from '../src/analysis/harmony/index.js';

const PPQ = 480;
const BAR = PPQ * 4;

function makeSong(pitches) {
  const notes = pitches.map((pitch, index) => ({
    id: `n${index}`,
    pitch,
    startTick: 0,
    durationTick: BAR,
    velocity: 100,
    trackId: 'chord',
    channel: 0,
    origin: 'test',
  }));
  return {
    ppq: PPQ,
    lengthTicks: BAR,
    tempoMap: [{ tick: 0, bpm: 120 }],
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
    tracks: [{ id: 'chord', name: 'Chord', noteCount: notes.length, channels: [0], isDrums: false, roleHint: 'chord' }],
    notes,
  };
}

test('adds slash-chord display when a chord tone is the lowest note', () => {
  const result = analyzeHarmonyDetails(makeSong([52, 55, 60])); // E3 G3 C4
  assert.ok(result.segments.length >= 1);
  assert.equal(result.segments[0].baseCandidate.value, 'C');
  assert.equal(result.segments[0].displayValue, 'C/E');
  assert.equal(result.segments[0].inversion.name, 'E');
});

test('detects add9 color above a C major candidate', () => {
  const result = analyzeHarmonyDetails(makeSong([48, 55, 60, 62, 64])); // C G C D E
  assert.ok(result.segments.length >= 1);
  assert.equal(result.segments[0].baseCandidate.value, 'C');
  assert.ok(result.segments[0].extensions.some((item) => item.label === 'add9'));
});
