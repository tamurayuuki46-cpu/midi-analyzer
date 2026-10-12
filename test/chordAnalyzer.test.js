import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeChords, buildAnalysisWindows, degreeForPitchClass, getDefaultChordTrackIds } from '../src/analysis/chord/analyzeChords.js';

function song(notes, tracks = [{ id: 'track-1', name: 'Piano', noteCount: notes.length, isDrums: false, roleHint: 'chord' }], extra = {}) {
  return {
    ppq: 480,
    lengthTicks: 1920,
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
    tracks,
    notes,
    ...extra,
  };
}

function chordNotes(pitches, startTick = 0, durationTick = 480, trackId = 'track-1', velocity = 100, channel = 0) {
  return pitches.map((pitch, index) => ({ id: `n${pitch}-${index}`, pitch, startTick, durationTick, velocity, trackId, channel }));
}

test('C major triad ranks C first', () => {
  const result = analyzeChords(song(chordNotes([48, 60, 64, 67])));
  assert.equal(result.segments[0].candidates[0].value, 'C');
});

test('A minor triad ranks Am first', () => {
  const result = analyzeChords(song(chordNotes([45, 57, 60, 64])));
  assert.equal(result.segments[0].candidates[0].value, 'Am');
});

test('C/E inversion remains C because all C triad tones match', () => {
  const result = analyzeChords(song(chordNotes([52, 60, 64, 67])));
  assert.equal(result.segments[0].candidates[0].value, 'C');
});

test('G7 with seventh present prefers G7 over G major', () => {
  const result = analyzeChords(song(chordNotes([43, 55, 59, 62, 65])));
  assert.equal(result.segments[0].candidates[0].value, 'G7');
});

test('track selection and Channel 10 drum exclusion work', () => {
  const notes = [
    ...chordNotes([48, 60, 64, 67], 0, 480, 'chords'),
    ...chordNotes([54, 66, 70, 73], 0, 480, 'melody'),
    ...chordNotes([36, 38, 42], 0, 480, 'drums', 127, 9),
  ];
  const tracks = [
    { id: 'chords', name: 'Chords', noteCount: 4, isDrums: false, roleHint: 'chord' },
    { id: 'melody', name: 'Melody', noteCount: 4, isDrums: false, roleHint: 'melody' },
    { id: 'drums', name: 'Drums', noteCount: 3, isDrums: true, roleHint: 'drums' },
  ];
  assert.deepEqual([...getDefaultChordTrackIds(song(notes, tracks))], ['chords']);
  const result = analyzeChords(song(notes, tracks), { trackIds: ['chords', 'drums'] });
  assert.equal(result.segments[0].candidates[0].value, 'C');
});

test('sparse two-note chord lowers confidence', () => {
  const sparse = analyzeChords(song(chordNotes([48, 64]))).segments[0].candidates[0].confidence;
  const full = analyzeChords(song(chordNotes([48, 60, 64, 67]))).segments[0].candidates[0].confidence;
  assert.ok(sparse < full);
});

test('6/8 uses eighth-note analysis grid and dotted-quarter musical beat', () => {
  const windows = buildAnalysisWindows(song(chordNotes([48, 60, 64]), [], {
    lengthTicks: 1440,
    timeSignatures: [{ tick: 0, numerator: 6, denominator: 8 }],
  }));
  assert.equal(windows[0].gridTicks, 240);
  assert.equal(windows[0].musicalBeatTicks, 720);
  assert.equal(windows.length, 6);
});

test('Degree in C major marks B-flat as flat VII and out of scale', () => {
  assert.deepEqual(degreeForPitchClass(0, 'C major'), { value: 'I', outOfScale: false });
  assert.deepEqual(degreeForPitchClass(10, 'C major'), { value: '♭VII', outOfScale: true });
});

test('Degree in A minor uses natural-minor degree map', () => {
  assert.deepEqual(degreeForPitchClass(0, 'A minor'), { value: 'III', outOfScale: false });
  assert.deepEqual(degreeForPitchClass(8, 'A minor'), { value: '♯VII', outOfScale: true });
});

test('repeated same chord grids are grouped into one segment', () => {
  const notes = [
    ...chordNotes([48, 60, 64, 67], 0, 480),
    ...chordNotes([48, 60, 64, 67], 480, 480),
  ];
  const result = analyzeChords(song(notes));
  assert.equal(result.segments.length, 1);
  assert.equal(result.segments[0].startTick, 0);
  assert.equal(result.segments[0].endTick, 960);
});
