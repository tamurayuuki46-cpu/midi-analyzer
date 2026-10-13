import assert from 'node:assert/strict';
import test from 'node:test';
import { generate12KeyVariants, parseKey, transposeNotesChromatic, transposeNotesDegreePreserve } from '../src/midi/transpose.js';

const notes = [60, 64, 67, 69].map((pitchMidi, index) => ({ pitchMidi, startTimeSeconds:index, durationSeconds:0.5, amplitude:0.8 }));

test('parseKey supports sharps/flats and major/minor', () => {
  assert.deepEqual(parseKey('E Major'), { tonic:4, mode:'major', name:'E major' });
  assert.equal(parseKey('Db minor').tonic, 1);
});

test('chromatic transpose shifts all pitches', () => {
  assert.deepEqual(transposeNotesChromatic(notes, 2).map((n)=>n.pitchMidi), [62,66,69,71]);
});

test('degree preserve maps I-V-vi-IV style pitch classes across major keys', () => {
  const eMajor = [64, 71, 73, 69].map((pitchMidi)=>({ pitchMidi })); // E B C# A
  const cMajor = transposeNotesDegreePreserve(eMajor, 'E major', 'C major');
  assert.deepEqual(cMajor.map((n)=>n.pitchMidi % 12), [0,7,9,5]);
});

test('12-key generation returns every tonic without mutating source notes', () => {
  const original = structuredClone(notes);
  const variants = generate12KeyVariants(notes, 'C major');
  assert.equal(variants.length, 12);
  assert.equal(new Set(variants.map((v)=>v.pitchClass)).size, 12);
  assert.deepEqual(notes, original);
});
