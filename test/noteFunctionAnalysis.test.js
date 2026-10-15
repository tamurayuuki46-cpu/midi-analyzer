import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeNoteFunctions, parseNoteFunctionKey } from '../src/analysis/note-function/index.js';

function makeSong(pitches) {
  return {
    ppq: 480,
    lengthTicks: Math.max(1920, pitches.length * 480),
    tracks: [{ id: 'lead', name: 'Lead', roleHint: 'melody', noteCount: pitches.length, isDrums: false, channels: [0] }],
    notes: pitches.map((pitch, index) => ({
      id: `n${index + 1}`,
      trackId: 'lead',
      pitch,
      startTick: index * 480,
      durationTick: 240,
      velocity: 100,
      channel: 0,
    })),
  };
}

function chordSegment(candidate, endTick = 3840) {
  return [{
    id: 'bar-1',
    startTick: 0,
    endTick,
    candidates: [candidate],
    effectiveCandidate: candidate,
    selectionSource: 'candidate',
  }];
}

const cMajor = { value: 'C', root: 0, quality: 'major', confidence: 0.9 };

test('key labels used by Key Analyzer can be parsed for scale-tone analysis', () => {
  assert.deepEqual(parseNoteFunctionKey('C major'), { value: 'C major', root: 0, scale: 'major' });
  assert.deepEqual(parseNoteFunctionKey('E♭ minor'), { value: 'E♭ minor', root: 3, scale: 'minor' });
  assert.equal(parseNoteFunctionKey('unknown'), null);
});

test('Chord Tone and Scale Tone are classified independently', () => {
  const c7 = { value: 'C7', root: 0, quality: '7', confidence: 0.9 };
  const song = makeSong([60, 62, 64, 70]); // C, D, E, B♭
  const result = analyzeNoteFunctions(song, {
    keyValue: 'C major',
    chordSegments: chordSegment(c7),
  });

  assert.equal(result.scaleTone.evaluated, 4);
  assert.equal(result.scaleTone.tone, 3);
  assert.equal(result.scaleTone.nonScaleTone, 1);
  assert.equal(result.scaleTone.ratio, 0.75);

  assert.equal(result.chordTone.evaluated, 4);
  assert.equal(result.chordTone.tone, 3);
  assert.equal(result.chordTone.nonChordTone, 1);
  assert.equal(result.chordTone.ratio, 0.75);

  assert.deepEqual(result.relationship, {
    evaluated: 4,
    both: 2,
    scaleOnly: 1,
    chordOnly: 1,
    outsideBoth: 0,
  });
  assert.equal(result.notes[1].relation, 'scale-only');
  assert.equal(result.notes[3].relation, 'chord-only');
});

test('a chromatic non-chord note can be outside both without being treated as an error', () => {
  const song = makeSong([66]); // F♯
  const result = analyzeNoteFunctions(song, {
    keyValue: 'C major',
    chordSegments: chordSegment(cMajor),
  });

  assert.equal(result.relationship.outsideBoth, 1);
  assert.equal(result.notes[0].scaleTone, false);
  assert.equal(result.notes[0].chordTone, false);
  assert.match(result.note, /誤りとは判定しません/);
});

test('same-onset melody notes use one representative note like the basic Melody analyzer', () => {
  const song = {
    ppq: 480,
    lengthTicks: 960,
    tracks: [{ id: 'lead', name: 'Lead', roleHint: 'melody', noteCount: 3, isDrums: false, channels: [0] }],
    notes: [
      { id: 'quiet', trackId: 'lead', pitch: 60, startTick: 0, durationTick: 240, velocity: 80, channel: 0 },
      { id: 'loud', trackId: 'lead', pitch: 64, startTick: 0, durationTick: 240, velocity: 110, channel: 0 },
      { id: 'next', trackId: 'lead', pitch: 67, startTick: 480, durationTick: 240, velocity: 100, channel: 0 },
    ],
  };
  const result = analyzeNoteFunctions(song, { keyValue: 'C major' });
  assert.equal(result.noteCount, 2);
  assert.deepEqual(result.notes.map((entry) => entry.pitch), [64, 67]);
});

test('stepwise non-chord note between two chord tones is a passing candidate', () => {
  const result = analyzeNoteFunctions(makeSong([60, 62, 64]), {
    keyValue: 'C major',
    chordSegments: chordSegment(cMajor),
  });
  assert.equal(result.notes[1].functionCandidate, 'passing-candidate');
  assert.equal(result.nonChordFunction.passing, 1);
});

test('departure and return by step is a neighbor candidate', () => {
  const result = analyzeNoteFunctions(makeSong([60, 62, 60]), {
    keyValue: 'C major',
    chordSegments: chordSegment(cMajor),
  });
  assert.equal(result.notes[1].functionCandidate, 'neighbor-candidate');
  assert.equal(result.nonChordFunction.neighbor, 1);
});

test('step into a following chord tone is an approach candidate when passing criteria are not met', () => {
  const result = analyzeNoteFunctions(makeSong([62, 66, 67]), {
    keyValue: 'C major',
    chordSegments: chordSegment(cMajor),
  });
  assert.equal(result.notes[1].functionCandidate, 'approach-candidate');
  assert.equal(result.nonChordFunction.approach, 1);
});

test('widely spaced melody events are not forced into temporal non-chord labels', () => {
  const song = makeSong([60, 62, 64]);
  song.notes[1].startTick = 2400;
  song.notes[2].startTick = 4800;
  song.lengthTicks = 5760;
  const result = analyzeNoteFunctions(song, {
    keyValue: 'C major',
    chordSegments: chordSegment(cMajor, 5760),
  });
  assert.equal(result.notes[1].functionCandidate, 'other-non-chord');
});

test('minor scale basis can switch between natural harmonic and melodic ascending', () => {
  const song = makeSong([68, 66]); // G♯, F♯ against A minor
  const natural = analyzeNoteFunctions(song, { keyValue: 'A minor', scaleMode: 'natural-minor' });
  const harmonic = analyzeNoteFunctions(song, { keyValue: 'A minor', scaleMode: 'harmonic-minor' });
  const melodic = analyzeNoteFunctions(song, { keyValue: 'A minor', scaleMode: 'melodic-minor' });

  assert.equal(natural.scaleBasis.id, 'natural-minor');
  assert.equal(natural.scaleTone.tone, 0);
  assert.equal(harmonic.scaleTone.tone, 1);
  assert.equal(melodic.scaleTone.tone, 2);
  assert.match(melodic.scaleBasis.label, /ascending/);
});
