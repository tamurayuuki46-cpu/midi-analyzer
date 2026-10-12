import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeStructure } from '../src/analysis/structure/index.js';

const PPQ = 480;
const BAR = PPQ * 4;

function chordNotes(pitches, barIndex) {
  const startTick = barIndex * BAR;
  return pitches.map((pitch, index) => ({
    id: `b${barIndex}-n${index}`,
    pitch,
    startTick,
    durationTick: BAR,
    velocity: 100,
    trackId: 'chord',
    channel: 0,
    origin: 'test',
  }));
}

test('groups similar 4-bar blocks into the same section label and detects key changes', () => {
  const notes = [];
  for (let bar = 0; bar < 4; bar += 1) notes.push(...chordNotes([60, 64, 67], bar));
  for (let bar = 4; bar < 8; bar += 1) notes.push(...chordNotes([62, 66, 69], bar));
  for (let bar = 8; bar < 12; bar += 1) notes.push(...chordNotes([60, 64, 67], bar));

  const song = {
    ppq: PPQ,
    lengthTicks: BAR * 12,
    tempoMap: [{ tick: 0, bpm: 120 }],
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
    tracks: [{ id: 'chord', name: 'Chord', noteCount: notes.length, channels: [0], isDrums: false, roleHint: 'chord' }],
    notes,
  };

  const result = analyzeStructure(song);
  assert.equal(result.sections.length, 3);
  assert.equal(result.sections[0].label, result.sections[2].label);
  assert.notEqual(result.sections[0].label, result.sections[1].label);
  assert.equal(result.keyTimeline.length, 3);
  assert.ok(result.keyTimeline[0].effective);
  assert.ok(result.keyTimeline[1].effective);
  assert.notEqual(result.keyTimeline[0].effective.value, result.keyTimeline[1].effective.value);
  assert.ok(result.modulations.length >= 2);
});

test('returns empty structure for a song without analyzable length', () => {
  const result = analyzeStructure({ ppq: PPQ, lengthTicks: 0, timeSignatures: [], tracks: [], notes: [] });
  assert.deepEqual(result.sections, []);
  assert.deepEqual(result.keyTimeline, []);
});
