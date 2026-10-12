import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import {
  createSavedMidiRecord,
  deleteSavedMidi,
  getSavedMidi,
  isIndexedDbAvailable,
  listSavedMidis,
  saveImportedMidi,
} from '../src/storage/indexedDb.js';

function makeFile(name = 'song.mid', bytes = [77, 84, 104, 100]) {
  const data = Uint8Array.from(bytes);
  return {
    name,
    size: data.byteLength,
    type: 'audio/midi',
    lastModified: 123456789,
    async arrayBuffer() {
      return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    },
  };
}

function makeImportResult(fileName = 'song.mid') {
  return {
    song: {
      schemaVersion: '0.1',
      source: { fileName, origin: 'midi' },
      ppq: 480,
      tempoMap: [],
      timeSignatures: [],
      lengthTicks: 960,
      tracks: [{ id: 'track-1', name: 'Piano', channels: [0], noteCount: 1, isDrums: false, roleHint: 'chord' }],
      notes: [{ id: 'n-1', pitch: 60, startTick: 0, durationTick: 480, velocity: 100, trackId: 'track-1', channel: 0, origin: 'midi' }],
    },
    warnings: [],
  };
}

test('IndexedDB availability check is explicit', () => {
  assert.equal(isIndexedDbAvailable(new IDBFactory()), true);
  assert.equal(isIndexedDbAvailable(undefined), false);
});

test('saved record preserves raw MIDI bytes and normalized result', async () => {
  const record = await createSavedMidiRecord({
    file: makeFile(),
    importResult: makeImportResult(),
    id: 'record-1',
    savedAt: '2026-10-12T12:00:00.000Z',
  });

  assert.equal(record.id, 'record-1');
  assert.equal(record.source.fileName, 'song.mid');
  assert.equal(record.song.ppq, 480);
  assert.deepEqual([...new Uint8Array(record.midiBytes)], [77, 84, 104, 100]);
});

test('save, get, list and delete work with IndexedDB', async () => {
  const indexedDBFactory = new IDBFactory();
  const file = makeFile();
  const importResult = makeImportResult();

  const saved = await saveImportedMidi(
    { file, importResult, id: 'record-1', savedAt: '2026-10-12T12:00:00.000Z' },
    { indexedDBFactory },
  );
  assert.equal(saved.id, 'record-1');

  const loaded = await getSavedMidi('record-1', { indexedDBFactory });
  assert.equal(loaded.song.notes.length, 1);
  assert.deepEqual([...new Uint8Array(loaded.midiBytes)], [77, 84, 104, 100]);

  const list = await listSavedMidis({ indexedDBFactory });
  assert.equal(list.length, 1);
  assert.equal(list[0].id, 'record-1');
  assert.equal(list[0].noteCount, 1);
  assert.equal('midiBytes' in list[0], false);

  await deleteSavedMidi('record-1', { indexedDBFactory });
  assert.equal(await getSavedMidi('record-1', { indexedDBFactory }), undefined);
  assert.deepEqual(await listSavedMidis({ indexedDBFactory }), []);
});

test('saved list is newest first', async () => {
  const indexedDBFactory = new IDBFactory();
  const importResult = makeImportResult();

  await saveImportedMidi(
    { file: makeFile('old.mid'), importResult, id: 'old', savedAt: '2026-10-11T12:00:00.000Z' },
    { indexedDBFactory },
  );
  await saveImportedMidi(
    { file: makeFile('new.mid'), importResult, id: 'new', savedAt: '2026-10-12T12:00:00.000Z' },
    { indexedDBFactory },
  );

  const list = await listSavedMidis({ indexedDBFactory });
  assert.deepEqual(list.map((item) => item.id), ['new', 'old']);
});
