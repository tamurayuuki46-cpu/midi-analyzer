import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeBassDetail,
  analyzeCounterMelody,
  analyzeDrumDetail,
  analyzePartCandidates,
  analyzePartDeep,
} from '../src/analysis/deep/index.js';

function baseSong({ tracks, notes, lengthTicks = 1920, ppq = 480 }) {
  return {
    ppq,
    lengthTicks,
    source: { fileName: 'deep.mid' },
    tempoMap: [{ tick: 0, bpm: 120 }],
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
    tracks,
    notes,
  };
}

function note(id, trackId, pitch, startTick, durationTick = 240, channel = 0, velocity = 100) {
  return { id, trackId, pitch, startTick, durationTick, channel, velocity };
}

test('counter melody detects contrary motion between two melodic tracks', () => {
  const tracks = [
    { id: 'melody', name: 'Lead', noteCount: 4, isDrums: false, roleHint: 'melody', channels: [0] },
    { id: 'counter', name: 'Counter', noteCount: 4, isDrums: false, roleHint: 'melody', channels: [1] },
  ];
  const notes = [
    note('m1', 'melody', 60, 0), note('m2', 'melody', 62, 240), note('m3', 'melody', 64, 480), note('m4', 'melody', 65, 720),
    note('c1', 'counter', 72, 0, 240, 1), note('c2', 'counter', 71, 240, 240, 1), note('c3', 'counter', 70, 480, 240, 1), note('c4', 'counter', 69, 720, 240, 1),
  ];
  const result = analyzeCounterMelody(baseSong({ tracks, notes, lengthTicks: 960 }));
  assert.equal(result.counterTrackId, 'counter');
  assert.equal(result.motion.contrary, 3);
  assert.equal(result.motion.contraryRatio, 1);
});

test('counter melody reports melody-gap use and second-interval collision candidates', () => {
  const tracks = [
    { id: 'melody', name: 'Lead', noteCount: 1, isDrums: false, roleHint: 'melody', channels: [0] },
    { id: 'counter', name: 'Counter', noteCount: 2, isDrums: false, roleHint: null, channels: [1] },
  ];
  const notes = [
    note('m1', 'melody', 60, 0),
    note('c1', 'counter', 62, 0, 240, 1),
    note('c2', 'counter', 65, 240, 240, 1),
  ];
  const result = analyzeCounterMelody(baseSong({ tracks, notes, lengthTicks: 480 }), { melodyTrackId: 'melody', counterTrackId: 'counter' });
  assert.equal(result.gaps.counterInMelodyGap, 1);
  assert.equal(result.collisions.secondIntervalCandidates, 1);
});

test('bass detail detects pedal tendency, octave moves and chromatic steps', () => {
  const tracks = [{ id: 'bass', name: 'Bass', noteCount: 4, isDrums: false, roleHint: 'bass', channels: [0] }];
  const notes = [
    note('b1', 'bass', 36, 0, 240),
    note('b2', 'bass', 48, 480, 240),
    note('b3', 'bass', 49, 960, 240),
    note('b4', 'bass', 48, 1440, 240),
  ];
  const result = analyzeBassDetail(baseSong({ tracks, notes }));
  assert.equal(result.pedal.name, 'C');
  assert.equal(result.pedal.count, 3);
  assert.equal(result.movement.octaveMoves, 1);
  assert.equal(result.movement.chromaticSteps, 2);
});

test('drum detail groups GM notes and marks tom-heavy bar as fill candidate', () => {
  const tracks = [{ id: 'drums', name: 'Drums', noteCount: 6, isDrums: true, roleHint: 'drums', channels: [9] }];
  const notes = [
    note('d1', 'drums', 36, 0, 120, 9), note('d2', 'drums', 38, 960, 120, 9),
    note('d3', 'drums', 45, 1920, 120, 9), note('d4', 'drums', 47, 2160, 120, 9),
    note('d5', 'drums', 48, 2400, 120, 9), note('d6', 'drums', 49, 2640, 120, 9),
  ];
  const result = analyzeDrumDetail(baseSong({ tracks, notes, lengthTicks: 3840 }));
  assert.equal(result.categoryCounts.kick, 1);
  assert.equal(result.categoryCounts.snare, 1);
  assert.equal(result.categoryCounts.tom, 3);
  assert.ok(result.usedGmNotes.some((item) => item.pitch === 36 && item.name === 'Bass Drum 1'));
  assert.ok(result.fills.some((fill) => fill.barNumber === 2));
});

test('part candidates preserve explicit role hints and drum identity', () => {
  const tracks = [
    { id: 'melody', name: 'Lead', noteCount: 2, isDrums: false, roleHint: 'melody', channels: [0] },
    { id: 'chord', name: 'Piano', noteCount: 3, isDrums: false, roleHint: 'chord', channels: [1] },
    { id: 'bass', name: 'Bass', noteCount: 2, isDrums: false, roleHint: 'bass', channels: [2] },
    { id: 'drums', name: 'Drums', noteCount: 1, isDrums: true, roleHint: 'drums', channels: [9] },
  ];
  const notes = [
    note('m1', 'melody', 72, 0), note('m2', 'melody', 74, 480),
    note('c1', 'chord', 60, 0, 480, 1), note('c2', 'chord', 64, 0, 480, 1), note('c3', 'chord', 67, 0, 480, 1),
    note('b1', 'bass', 36, 0, 480, 2), note('b2', 'bass', 43, 480, 480, 2),
    note('d1', 'drums', 36, 0, 120, 9),
  ];
  const result = analyzePartCandidates(baseSong({ tracks, notes }));
  const roles = Object.fromEntries(result.candidates.map((item) => [item.trackId, item.roleCandidate]));
  assert.deepEqual(roles, { melody: 'melody', chord: 'chord', bass: 'bass', drums: 'drums' });
  assert.equal(analyzePartDeep(baseSong({ tracks, notes })).parts.candidates.length, 4);
});
