import test from 'node:test';
import assert from 'node:assert/strict';
import {
  InvalidMidiDataError,
  UnsupportedMidiTimingError,
  normalizeMidi,
} from '../src/midi/normalizeMidi.js';

function makeBasicMidi() {
  return {
    header: { format: 1, numTracks: 2, ticksPerBeat: 480 },
    tracks: [
      [
        { deltaTime: 0, meta: true, type: 'trackName', text: 'Conductor' },
        { deltaTime: 0, meta: true, type: 'setTempo', microsecondsPerBeat: 500000 },
        { deltaTime: 0, meta: true, type: 'timeSignature', numerator: 4, denominator: 4 },
        { deltaTime: 960, meta: true, type: 'endOfTrack' },
      ],
      [
        { deltaTime: 0, meta: true, type: 'trackName', text: 'Piano Chords' },
        { deltaTime: 0, type: 'noteOn', channel: 0, noteNumber: 60, velocity: 100 },
        { deltaTime: 480, type: 'noteOff', channel: 0, noteNumber: 60, velocity: 0 },
        { deltaTime: 0, type: 'noteOn', channel: 0, noteNumber: 64, velocity: 90 },
        { deltaTime: 480, type: 'noteOn', channel: 0, noteNumber: 64, velocity: 0 },
        { deltaTime: 0, meta: true, type: 'endOfTrack' },
      ],
    ],
  };
}

test('normalizes notes, tracks, tempo and time signature without changing ticks', () => {
  const { song, warnings } = normalizeMidi(makeBasicMidi(), {
    fileName: 'basic.mid',
    origin: 'midi',
  });

  assert.equal(song.schemaVersion, '0.1');
  assert.equal(song.source.fileName, 'basic.mid');
  assert.equal(song.ppq, 480);
  assert.equal(song.lengthTicks, 960);
  assert.equal(song.notes.length, 2);
  assert.deepEqual(song.notes.map((note) => [note.pitch, note.startTick, note.durationTick]), [
    [60, 0, 480],
    [64, 480, 480],
  ]);
  assert.equal(song.tracks[1].name, 'Piano Chords');
  assert.deepEqual(song.tracks[1].channels, [0]);
  assert.equal(song.tracks[1].roleHint, 'chord');
  assert.equal(song.tempoMap[0].bpm, 120);
  assert.equal(song.timeSignatures[0].numerator, 4);
  assert.equal(warnings.length, 0);
});

test('uses MIDI channel 10 (zero-based 9) as drum track hint', () => {
  const parsed = {
    header: { ticksPerBeat: 480 },
    tracks: [[
      { deltaTime: 0, type: 'trackName', text: 'Kit' },
      { deltaTime: 0, type: 'noteOn', channel: 9, noteNumber: 36, velocity: 100 },
      { deltaTime: 120, type: 'noteOff', channel: 9, noteNumber: 36, velocity: 0 },
    ]],
  };

  const { song } = normalizeMidi(parsed);
  assert.equal(song.tracks[0].isDrums, true);
  assert.equal(song.tracks[0].roleHint, 'drums');
  assert.equal(song.notes[0].channel, 9);
});

test('keeps multiple channels on one track instead of forcing a single channel', () => {
  const parsed = {
    header: { ticksPerBeat: 480 },
    tracks: [[
      { deltaTime: 0, type: 'noteOn', channel: 0, noteNumber: 60, velocity: 100 },
      { deltaTime: 120, type: 'noteOff', channel: 0, noteNumber: 60, velocity: 0 },
      { deltaTime: 0, type: 'noteOn', channel: 2, noteNumber: 67, velocity: 100 },
      { deltaTime: 120, type: 'noteOff', channel: 2, noteNumber: 67, velocity: 0 },
    ]],
  };

  const { song } = normalizeMidi(parsed);
  assert.deepEqual(song.tracks[0].channels, [0, 2]);
  assert.equal(song.tracks[0].isDrums, false);
});

test('inserts implicit standard defaults when tempo or meter events are absent', () => {
  const parsed = {
    header: { ticksPerBeat: 960 },
    tracks: [[]],
  };

  const { song } = normalizeMidi(parsed);
  assert.deepEqual(song.tempoMap[0], {
    tick: 0,
    microsecondsPerBeat: 500000,
    bpm: 120,
    implicit: true,
  });
  assert.deepEqual(song.timeSignatures[0], {
    tick: 0,
    numerator: 4,
    denominator: 4,
    implicit: true,
  });
});

test('reports unmatched note messages instead of inventing note durations', () => {
  const parsed = {
    header: { ticksPerBeat: 480 },
    tracks: [[
      { deltaTime: 0, type: 'noteOff', channel: 0, noteNumber: 60, velocity: 0 },
      { deltaTime: 10, type: 'noteOn', channel: 0, noteNumber: 64, velocity: 100 },
    ]],
  };

  const { song, warnings } = normalizeMidi(parsed);
  assert.equal(song.notes.length, 0);
  assert.deepEqual(warnings.map((warning) => warning.code), [
    'UNMATCHED_NOTE_OFF',
    'UNMATCHED_NOTE_ON',
  ]);
});

test('rejects SMPTE timing in v0.1', () => {
  assert.throws(
    () => normalizeMidi({ header: { framesPerSecond: 25, ticksPerFrame: 40 }, tracks: [] }),
    UnsupportedMidiTimingError,
  );
});

test('rejects unknown origin values', () => {
  assert.throws(
    () => normalizeMidi({ header: { ticksPerBeat: 480 }, tracks: [] }, { origin: 'unknown' }),
    InvalidMidiDataError,
  );
});
