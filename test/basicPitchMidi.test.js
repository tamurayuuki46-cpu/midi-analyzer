import assert from 'node:assert/strict';
import test from 'node:test';
import { noteEventsToMidi } from '../src/audio/noteEventsToMidi.js';
import { BASIC_PITCH_LIMITS, validateAudioFile } from '../src/audio/basicPitchTranscriber.js';
import { importMidiFile } from '../src/midi/index.js';
import { buildAnalysisBundle } from '../src/analysis/summary/buildAnalysisBundle.js';

test('Basic Pitch generated and edited MIDI reaches the existing Analyzer with its origin intact', async () => {
  const bytes = noteEventsToMidi([
    { pitchMidi: 60, startTimeSeconds: 0, durationSeconds: 0.5, amplitude: 0.8 },
    { pitchMidi: 64, startTimeSeconds: 0.5, durationSeconds: 0.5, amplitude: 0.7 },
  ], { bpm: 120, ppq: 480 });
  const file = { name: 'basic_pitch.mid', arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
  const { song, warnings } = await importMidiFile(file, { origin: 'basic-pitch' });
  assert.equal(song.source.origin, 'basic-pitch');
  assert.deepEqual(song.notes.map(note => note.origin), ['basic-pitch', 'basic-pitch']);
  assert.deepEqual(song.notes.map(note => [note.pitch, note.startTick, note.durationTick]), [[60, 0, 480], [64, 480, 480]]);
  assert.equal(warnings.length, 0);
  assert.doesNotThrow(() => buildAnalysisBundle(song));
});

test('Basic Pitch note events encode to a valid one-track MIDI file', () => {
  const bytes = noteEventsToMidi([
    { pitchMidi: 60, startTimeSeconds: 0, durationSeconds: 0.5, amplitude: 0.8 },
    { pitchMidi: 64, startTimeSeconds: 0.5, durationSeconds: 0.5, amplitude: 0.7 },
  ], { bpm: 120, ppq: 480, trackName: 'Audio Test' });

  const raw = [...bytes];
  assert.equal(Buffer.from(bytes.slice(0, 4)).toString('ascii'), 'MThd');
  assert.deepEqual(raw.slice(4, 8), [0, 0, 0, 6]);
  assert.deepEqual(raw.slice(8, 10), [0, 0]);
  assert.deepEqual(raw.slice(10, 12), [0, 1]);
  assert.equal((raw[12] << 8) | raw[13], 480);
  assert.ok(Buffer.from(bytes).toString('utf8').includes('Audio Test'));
  assert.ok(raw.some((value, index) => value === 0xff && raw[index + 1] === 0x51), 'tempo meta missing');
  assert.ok(raw.some((value, index) => (value & 0xf0) === 0x90), 'note-on missing');
});

test('Audio validation accepts target formats and rejects oversized input', () => {
  assert.equal(validateAudioFile({ name: 'song.wav', size: 1024, type: 'audio/wav' }), true);
  assert.equal(validateAudioFile({ name: 'song.mp3', size: 1024, type: 'audio/mpeg' }), true);
  assert.equal(validateAudioFile({ name: 'song.m4a', size: 1024, type: 'audio/mp4' }), true);
  assert.throws(
    () => validateAudioFile({ name: 'too-large.wav', size: BASIC_PITCH_LIMITS.maxFileBytes + 1, type: 'audio/wav' }),
    /120MB/,
  );
  assert.throws(() => validateAudioFile({ name: 'notes.txt', size: 10, type: 'text/plain' }), /WAV/);
});

test('Basic Pitch Android safety limits are explicit', () => {
  assert.equal(BASIC_PITCH_LIMITS.modelSampleRate, 22050);
  assert.equal(BASIC_PITCH_LIMITS.chunkSeconds, 30);
  assert.equal(BASIC_PITCH_LIMITS.overlapSeconds, 1);
  assert.equal(BASIC_PITCH_LIMITS.maxAudioSeconds, 480);
});
