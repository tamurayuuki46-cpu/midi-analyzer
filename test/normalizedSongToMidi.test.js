import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizedSongToMidi } from '../src/midi/normalizedSongToMidi.js';

test('normalized Analyzer song exports as Format 1 with meta + source tracks', () => {
  const song = {
    ppq: 480,
    source: { fileName: 'source.mid' },
    tempoMap: [{ tick: 0, bpm: 120, microsecondsPerBeat: 500000 }],
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
    tracks: [
      { id: 't1', name: 'Piano' },
      { id: 't2', name: 'Bass' },
    ],
    notes: [
      { trackId: 't1', pitch: 60, startTick: 0, durationTick: 480, velocity: 100, channel: 0 },
      { trackId: 't2', pitch: 36, startTick: 0, durationTick: 960, velocity: 90, channel: 1 },
    ],
  };
  const bytes = normalizedSongToMidi(song, { trackNameSuffix: 'D major' });
  const raw = [...bytes];
  assert.equal(Buffer.from(bytes.slice(0,4)).toString('ascii'), 'MThd');
  assert.deepEqual(raw.slice(8,10), [0,1]);
  assert.equal((raw[10] << 8) | raw[11], 3, 'meta track + two source tracks');
  assert.equal((raw[12] << 8) | raw[13], 480);
  const text = Buffer.from(bytes).toString('utf8');
  assert.ok(text.includes('Piano D major'));
  assert.ok(text.includes('Bass D major'));
});
