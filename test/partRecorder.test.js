import test from 'node:test';
import assert from 'node:assert/strict';
import {
  audioExtensionForMimeType,
  buildPartSong,
  buildTakeRecord,
  inferPartTrackIds,
} from '../src/recording/partRecorderModel.js';

function makeSong() {
  return {
    schemaVersion: '0.1',
    source: { fileName: 'parts.mid', origin: 'midi' },
    ppq: 480,
    tempoMap: [{ tick: 0, bpm: 120 }],
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
    lengthTicks: 1920,
    tracks: [
      { id: 'mel', name: 'Lead', channels: [0], noteCount: 2, isDrums: false, roleHint: 'melody' },
      { id: 'chd', name: 'Piano', channels: [1], noteCount: 3, isDrums: false, roleHint: 'chord' },
      { id: 'bas', name: 'Bass', channels: [2], noteCount: 2, isDrums: false, roleHint: 'bass' },
      { id: 'drm', name: 'Drums', channels: [9], noteCount: 2, isDrums: true, roleHint: 'drums' },
    ],
    notes: [
      { id: 'm1', pitch: 72, startTick: 0, durationTick: 480, velocity: 100, trackId: 'mel', channel: 0, origin: 'midi' },
      { id: 'm2', pitch: 74, startTick: 480, durationTick: 480, velocity: 100, trackId: 'mel', channel: 0, origin: 'midi' },
      { id: 'c1', pitch: 60, startTick: 0, durationTick: 960, velocity: 90, trackId: 'chd', channel: 1, origin: 'midi' },
      { id: 'c2', pitch: 64, startTick: 0, durationTick: 960, velocity: 90, trackId: 'chd', channel: 1, origin: 'midi' },
      { id: 'c3', pitch: 67, startTick: 0, durationTick: 960, velocity: 90, trackId: 'chd', channel: 1, origin: 'midi' },
      { id: 'b1', pitch: 36, startTick: 0, durationTick: 480, velocity: 100, trackId: 'bas', channel: 2, origin: 'midi' },
      { id: 'b2', pitch: 43, startTick: 480, durationTick: 480, velocity: 100, trackId: 'bas', channel: 2, origin: 'midi' },
      { id: 'd1', pitch: 36, startTick: 0, durationTick: 120, velocity: 110, trackId: 'drm', channel: 9, origin: 'midi' },
      { id: 'd2', pitch: 38, startTick: 480, durationTick: 120, velocity: 110, trackId: 'drm', channel: 9, origin: 'midi' },
    ],
  };
}

test('part track inference prefers explicit role hints and drums', () => {
  const song = makeSong();
  assert.deepEqual(inferPartTrackIds(song, 'melody'), ['mel']);
  assert.deepEqual(inferPartTrackIds(song, 'chord'), ['chd']);
  assert.deepEqual(inferPartTrackIds(song, 'bass'), ['bas']);
  assert.deepEqual(inferPartTrackIds(song, 'drum'), ['drm']);
});

test('buildPartSong keeps timeline but filters tracks and notes', () => {
  const song = makeSong();
  const partSong = buildPartSong(song, ['mel', 'chd']);
  assert.equal(partSong.lengthTicks, song.lengthTicks);
  assert.deepEqual(partSong.tracks.map((track) => track.id), ['mel', 'chd']);
  assert.equal(partSong.notes.length, 5);
  assert.equal(song.notes.length, 9);
});

test('buildTakeRecord stores browser audio bytes and metadata', async () => {
  const song = makeSong();
  const blob = new Blob([Uint8Array.from([1, 2, 3, 4])], { type: 'audio/webm' });
  const record = await buildTakeRecord(song, {
    id: 'take-1',
    savedAt: '2026-10-13T01:00:00.000Z',
    blob,
    partType: 'melody',
    trackIds: ['mel'],
    name: 'Take A',
    durationSeconds: 2.5,
    eventCount: 2,
  });
  assert.equal(record.id, 'take-1');
  assert.equal(record.partType, 'melody');
  assert.equal(record.mimeType, 'audio/webm');
  assert.equal(record.durationSeconds, 2.5);
  assert.deepEqual([...new Uint8Array(record.audioBytes)], [1, 2, 3, 4]);
});

test('audio extension follows MediaRecorder mime type', () => {
  assert.equal(audioExtensionForMimeType('audio/webm;codecs=opus'), 'webm');
  assert.equal(audioExtensionForMimeType('audio/mp4'), 'm4a');
  assert.equal(audioExtensionForMimeType('audio/ogg'), 'ogg');
});
