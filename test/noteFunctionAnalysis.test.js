import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeNoteFunctions, parseNoteFunctionKey } from '../src/analysis/note-function/index.js';

function makeSong(pitches) {
  return {
    ppq: 480,
    lengthTicks: 1920,
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

function chordSegment(candidate) {
  return [{
    id: 'bar-1',
    startTick: 0,
    endTick: 1920,
    candidates: [candidate],
    effectiveCandidate: candidate,
    selectionSource: 'candidate',
  }];
}

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
  const cMajor = { value: 'C', root: 0, quality: 'major', confidence: 0.9 };
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
