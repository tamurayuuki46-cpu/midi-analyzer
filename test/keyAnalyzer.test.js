import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeKeyScale, buildPitchClassWeights } from '../src/analysis/key/index.js';

function makeSong(pairs, { channel = 0, ppq = 480 } = {}) {
  let id = 0;
  return {
    ppq,
    notes: pairs.map(([pitch, durationTick, velocity = 100]) => ({
      id: `n-${++id}`,
      pitch,
      startTick: 0,
      durationTick,
      velocity,
      channel,
      trackId: 'track-1',
      origin: 'midi',
    })),
  };
}

test('pitch class weights use duration x velocity and exclude drums', () => {
  const song = {
    ppq: 480,
    notes: [
      { pitch: 60, durationTick: 480, velocity: 100, channel: 0 },
      { pitch: 60, durationTick: 240, velocity: 50, channel: 0 },
      { pitch: 62, durationTick: 999, velocity: 127, channel: 9 },
    ],
  };
  const weights = buildPitchClassWeights(song);
  assert.equal(weights[0], 480 * 100 + 240 * 50);
  assert.equal(weights[2], 0);
});

test('C major profile ranks C major first', () => {
  const result = analyzeKeyScale(makeSong([
    [60, 1000], [64, 800], [67, 800], [62, 300], [65, 300], [69, 300], [71, 200],
  ]));
  assert.equal(result.candidates[0].value, 'C major');
  assert.equal(result.candidates.length, 3);
  assert.equal(result.selected, null);
});

test('A minor profile ranks A minor first', () => {
  const result = analyzeKeyScale(makeSong([
    [69, 1000], [60, 800], [64, 800], [71, 300], [62, 300], [65, 300], [67, 300],
  ]));
  assert.equal(result.candidates[0].value, 'A minor');
});

test('all confidence values stay in 0..1', () => {
  const result = analyzeKeyScale(makeSong([[60, 480], [64, 480], [67, 480]]));
  assert.ok(result.candidates.every((candidate) => candidate.confidence >= 0 && candidate.confidence <= 1));
});

test('drums-only MIDI returns no Key candidate', () => {
  const result = analyzeKeyScale(makeSong([[36, 480], [38, 480]], { channel: 9 }));
  assert.deepEqual(result.candidates, []);
  assert.match(result.note, /Drums以外/);
});

test('ambiguity hint never claims to change candidate order', () => {
  const result = analyzeKeyScale(makeSong([
    [60, 1000], [64, 800], [67, 800], [62, 300], [65, 300], [69, 300], [71, 200],
  ]));
  assert.ok(result.hint === null || result.hint.includes('候補順位には反映していません'));
});
