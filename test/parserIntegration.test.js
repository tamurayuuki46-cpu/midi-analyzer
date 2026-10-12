import test from 'node:test';
import assert from 'node:assert/strict';

import { importMidiFile } from '../src/midi/index.js';
import {
  FORMAT_0_DRUM_FIXTURE_HEX,
  FORMAT_1_TEMPO_FIXTURE_HEX,
  makeMidiFixtureFile,
} from './fixtures/fixedMidiFixtures.js';

test('Format 1 binary fixture parses tempo, meter, track names and absolute note ticks', async () => {
  const file = makeMidiFixtureFile('format-1-regression.mid', FORMAT_1_TEMPO_FIXTURE_HEX);
  const { song, warnings } = await importMidiFile(file, { origin: 'midi' });

  assert.equal(song.ppq, 480);
  assert.equal(song.tracks.length, 2);
  assert.deepEqual(song.tracks.map((track) => track.name), ['Tempo', 'Piano']);

  assert.equal(song.tempoMap.length, 2);
  assert.equal(song.tempoMap[0].tick, 0);
  assert.equal(song.tempoMap[0].microsecondsPerBeat, 500000);
  assert.equal(song.tempoMap[0].bpm, 120);
  assert.equal(song.tempoMap[1].tick, 480);
  assert.equal(song.tempoMap[1].microsecondsPerBeat, 400000);
  assert.equal(song.tempoMap[1].bpm, 150);

  assert.equal(song.timeSignatures[0].tick, 0);
  assert.equal(song.timeSignatures[0].numerator, 4);
  assert.equal(song.timeSignatures[0].denominator, 4);

  assert.equal(song.notes.length, 2);
  assert.deepEqual(
    song.notes.map(({ pitch, startTick, durationTick, velocity, channel }) => ({
      pitch,
      startTick,
      durationTick,
      velocity,
      channel,
    })),
    [
      { pitch: 60, startTick: 0, durationTick: 480, velocity: 100, channel: 0 },
      { pitch: 64, startTick: 480, durationTick: 240, velocity: 100, channel: 0 },
    ],
  );

  assert.equal(song.lengthTicks, 720);
  assert.equal(warnings.length, 0);
});

test('Format 0 binary fixture keeps channel 10 drums and 3/4 meter', async () => {
  const file = makeMidiFixtureFile('format-0-drums.mid', FORMAT_0_DRUM_FIXTURE_HEX);
  const { song, warnings } = await importMidiFile(file, { origin: 'ripx' });

  assert.equal(song.ppq, 480);
  assert.equal(song.tracks.length, 1);
  assert.equal(song.tracks[0].name, 'Drums');
  assert.deepEqual(song.tracks[0].channels, [9]);
  assert.equal(song.tracks[0].isDrums, true);
  assert.equal(song.tracks[0].roleHint, 'drums');

  assert.equal(song.timeSignatures[0].numerator, 3);
  assert.equal(song.timeSignatures[0].denominator, 4);

  assert.equal(song.tempoMap.length, 1);
  assert.equal(song.tempoMap[0].implicit, true);
  assert.equal(song.tempoMap[0].bpm, 120);

  assert.equal(song.notes.length, 1);
  assert.deepEqual(
    {
      pitch: song.notes[0].pitch,
      startTick: song.notes[0].startTick,
      durationTick: song.notes[0].durationTick,
      velocity: song.notes[0].velocity,
      channel: song.notes[0].channel,
      origin: song.notes[0].origin,
    },
    {
      pitch: 36,
      startTick: 0,
      durationTick: 240,
      velocity: 110,
      channel: 9,
      origin: 'ripx',
    },
  );

  assert.equal(song.lengthTicks, 240);
  assert.equal(warnings.length, 0);
});
