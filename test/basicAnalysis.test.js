import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeBass,
  analyzeMelody,
  analyzeRhythm,
  formatMidiPitch,
  getDefaultBassTrackId,
  getDefaultMelodyTrackId,
  getDefaultRhythmTrackIds,
} from '../src/analysis/basic/index.js';

function makeSong({ notes = [], tracks = [], lengthTicks = 1920, timeSignatures = [{ tick: 0, numerator: 4, denominator: 4 }] } = {}) {
  return {
    ppq: 480,
    lengthTicks,
    timeSignatures,
    tracks,
    notes,
  };
}

function track(id, roleHint, noteCount, { isDrums = false } = {}) {
  return { id, name: id, roleHint, noteCount, isDrums, channels: isDrums ? [9] : [0] };
}

function note(id, trackId, pitch, startTick, durationTick = 240, velocity = 100, channel = 0) {
  return { id, trackId, pitch, startTick, durationTick, velocity, channel };
}

const cMajorSegment = Object.freeze({
  id: 'c1',
  startTick: 0,
  endTick: 1920,
  candidates: Object.freeze([
    Object.freeze({ value: 'C', root: 0, quality: 'major', confidence: 0.9 }),
  ]),
  effectiveCandidate: Object.freeze({ value: 'C', root: 0, quality: 'major', confidence: 0.9 }),
  selectionSource: 'candidate',
});

test('role hints are preferred for Melody and Bass defaults', () => {
  const song = makeSong({
    tracks: [track('piano', 'chord', 2), track('lead', 'melody', 2), track('bass', 'bass', 2)],
    notes: [
      note('p1', 'piano', 60, 0), note('p2', 'piano', 64, 480),
      note('m1', 'lead', 72, 0), note('m2', 'lead', 74, 480),
      note('b1', 'bass', 36, 0), note('b2', 'bass', 38, 480),
    ],
  });
  assert.equal(getDefaultMelodyTrackId(song), 'lead');
  assert.equal(getDefaultBassTrackId(song), 'bass');
});

test('pitch fallback chooses highest track for Melody and lowest for Bass', () => {
  const song = makeSong({
    tracks: [track('high', null, 2), track('low', null, 2)],
    notes: [
      note('h1', 'high', 76, 0), note('h2', 'high', 79, 480),
      note('l1', 'low', 40, 0), note('l2', 'low', 43, 480),
    ],
  });
  assert.equal(getDefaultMelodyTrackId(song), 'high');
  assert.equal(getDefaultBassTrackId(song), 'low');
});

test('Melody analysis reports range, leap, repeated notes, density and chord-tone ratio', () => {
  const song = makeSong({
    tracks: [track('lead', 'melody', 4)],
    notes: [
      note('m1', 'lead', 60, 0),
      note('m2', 'lead', 62, 480),
      note('m3', 'lead', 64, 960),
      note('m4', 'lead', 64, 1440),
    ],
  });
  const result = analyzeMelody(song, { chordSegments: [cMajorSegment] });
  assert.deepEqual(result.range, { low: 60, high: 64, semitones: 4 });
  assert.equal(result.leap.maxSemitones, 2);
  assert.equal(result.leap.averageSemitones, 1.33);
  assert.equal(result.repeated.count, 1);
  assert.equal(result.density.notesPerQuarter, 1);
  assert.equal(result.chordTone.evaluated, 4);
  assert.equal(result.chordTone.chordTone, 3);
  assert.equal(result.chordTone.nonChordTone, 1);
  assert.equal(result.chordTone.ratio, 0.75);
  assert.equal(result.chordTone.provisionalCount, 4);
});

test('Melody same-onset notes are reduced to one representative onset', () => {
  const song = makeSong({
    tracks: [track('lead', 'melody', 3)],
    notes: [
      note('a', 'lead', 60, 0, 240, 90),
      note('b', 'lead', 72, 0, 240, 110),
      note('c', 'lead', 74, 480, 240, 100),
    ],
  });
  const result = analyzeMelody(song);
  assert.equal(result.sourceNoteCount, 3);
  assert.equal(result.noteCount, 2);
  assert.deepEqual(result.range, { low: 72, high: 74, semitones: 2 });
});

test('Bass analysis classifies Root / 3rd / 5th / Other against the active chord', () => {
  const c7 = {
    ...cMajorSegment,
    effectiveCandidate: { value: 'C7', root: 0, quality: '7', confidence: 0.9 },
    candidates: [{ value: 'C7', root: 0, quality: '7', confidence: 0.9 }],
  };
  const song = makeSong({
    tracks: [track('bass', 'bass', 4)],
    notes: [
      note('b1', 'bass', 36, 0),
      note('b2', 'bass', 40, 480),
      note('b3', 'bass', 43, 960),
      note('b4', 'bass', 46, 1440),
    ],
  });
  const result = analyzeBass(song, { chordSegments: [c7] });
  assert.deepEqual(
    { root: result.chordRole.root, third: result.chordRole.third, fifth: result.chordRole.fifth, other: result.chordRole.other },
    { root: 1, third: 1, fifth: 1, other: 1 },
  );
  assert.equal(result.chordRole.rootRatio, 0.25);
  assert.equal(result.rhythm.label, '拍頭中心');
});

test('Bass movement follows the lowest note at each onset', () => {
  const song = makeSong({
    tracks: [track('bass', 'bass', 4)],
    notes: [
      note('a1', 'bass', 48, 0), note('a2', 'bass', 36, 0),
      note('b1', 'bass', 43, 480), note('b2', 'bass', 55, 480),
    ],
  });
  const result = analyzeBass(song);
  assert.equal(result.noteCount, 2);
  assert.equal(result.movement.averageSemitones, 7);
  assert.equal(result.movement.up, 1);
});

test('Rhythm defaults to drum tracks when present and reports density', () => {
  const song = makeSong({
    tracks: [track('drums', 'drums', 4, { isDrums: true }), track('piano', 'chord', 2)],
    notes: [
      note('d1', 'drums', 36, 0, 120, 100, 9),
      note('d2', 'drums', 38, 480, 120, 100, 9),
      note('d3', 'drums', 42, 960, 120, 100, 9),
      note('d4', 'drums', 38, 1440, 120, 100, 9),
      note('p1', 'piano', 60, 240),
      note('p2', 'piano', 64, 720),
    ],
  });
  assert.deepEqual([...getDefaultRhythmTrackIds(song)], ['drums']);
  const result = analyzeRhythm(song);
  assert.equal(result.onsetCount, 4);
  assert.equal(result.density.onsetsPerQuarter, 1);
  assert.equal(result.beatPosition.onBeat, 4);
  assert.equal(result.beatPosition.syncopationCandidateCount, 0);
  assert.deepEqual([...result.meterGrids[0].cells], [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]);
});

test('Rhythm treats dotted-quarter as the musical beat in 6/8', () => {
  const song = makeSong({
    lengthTicks: 1440,
    timeSignatures: [{ tick: 0, numerator: 6, denominator: 8 }],
    tracks: [track('drums', 'drums', 3, { isDrums: true })],
    notes: [
      note('d1', 'drums', 36, 0, 120, 100, 9),
      note('d2', 'drums', 38, 240, 120, 100, 9),
      note('d3', 'drums', 42, 720, 120, 100, 9),
    ],
  });
  const result = analyzeRhythm(song);
  assert.equal(result.beatPosition.onBeat, 2);
  assert.equal(result.beatPosition.offBeat, 1);
  assert.equal(result.meterGrids[0].cellCount, 12);
});

test('formatMidiPitch renders note names with octave numbers', () => {
  assert.equal(formatMidiPitch(60), 'C4');
  assert.equal(formatMidiPitch(70), 'B♭4');
});
