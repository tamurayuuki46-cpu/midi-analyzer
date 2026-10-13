import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTopChordProgression } from '../src/analysis/chord/topProgression.js';

test('top chord progression keeps first-ranked candidate in segment order', () => {
  const progression = buildTopChordProgression([
    {
      id: 'chord-1',
      barNumber: 1,
      startTick: 0,
      endTick: 480,
      candidates: [
        { value: 'C', confidence: 0.91 },
        { value: 'Am', confidence: 0.72 },
      ],
    },
    {
      id: 'chord-2',
      barNumber: 1,
      startTick: 480,
      endTick: 960,
      candidates: [
        { value: 'G', confidence: 0.88 },
        { value: 'Em', confidence: 0.63 },
      ],
    },
    {
      id: 'chord-3',
      barNumber: 2,
      startTick: 960,
      endTick: 1440,
      candidates: [
        { value: 'Am', confidence: 0.84 },
      ],
    },
  ]);

  assert.deepEqual(progression.map((entry) => entry.value), ['C', 'G', 'Am']);
  assert.deepEqual(progression.map((entry) => entry.barNumber), [1, 1, 2]);
  assert.deepEqual(progression.map((entry) => entry.confidence), [0.91, 0.88, 0.84]);
});

test('top chord progression skips segments without candidates', () => {
  const progression = buildTopChordProgression([
    { id: 'empty', barNumber: 1, candidates: [] },
    { id: 'valid', barNumber: 2, candidates: [{ value: 'F', confidence: 0.75 }] },
  ]);

  assert.equal(progression.length, 1);
  assert.equal(progression[0].value, 'F');
  assert.equal(progression[0].segmentId, 'valid');
});
