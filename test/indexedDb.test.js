import test from 'node:test';
import assert from 'node:assert/strict';
import { IDBFactory } from 'fake-indexeddb';
import {
  STORAGE_CLIP_STORE_NAME,
  STORAGE_DB_NAME,
  STORAGE_DB_VERSION,
  STORAGE_STORE_NAME,
  createSavedMidiRecord,
  deleteSavedClip,
  deleteSavedMidi,
  getSavedClip,
  getSavedMidi,
  isIndexedDbAvailable,
  listSavedClips,
  listSavedMidis,
  openMidiDatabase,
  saveClipRecord,
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

function openLegacyV1(indexedDBFactory) {
  return new Promise((resolve, reject) => {
    const request = indexedDBFactory.open(STORAGE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      const store = db.createObjectStore(STORAGE_STORE_NAME, { keyPath: 'id' });
      store.createIndex('savedAt', 'savedAt', { unique: false });
      store.put({
        id: 'legacy-midi',
        savedAt: '2026-10-10T00:00:00.000Z',
        source: { fileName: 'legacy.mid', origin: 'midi' },
        song: makeImportResult('legacy.mid').song,
        warnings: [],
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
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

test('v2 migration preserves the legacy savedMidis store and adds savedClips', async () => {
  const indexedDBFactory = new IDBFactory();
  const legacyDb = await openLegacyV1(indexedDBFactory);
  legacyDb.close();

  const db = await openMidiDatabase(indexedDBFactory);
  assert.equal(db.version, STORAGE_DB_VERSION);
  assert.equal(STORAGE_DB_VERSION, 2);
  assert.equal(db.objectStoreNames.contains(STORAGE_STORE_NAME), true);
  assert.equal(db.objectStoreNames.contains(STORAGE_CLIP_STORE_NAME), true);
  db.close();

  const legacy = await getSavedMidi('legacy-midi', { indexedDBFactory });
  assert.equal(legacy.source.fileName, 'legacy.mid');
});

test('save, get, list and delete work for clip records', async () => {
  const indexedDBFactory = new IDBFactory();
  const clip = {
    clipSchemaVersion: 1,
    id: 'clip-1',
    savedAt: '2026-10-13T00:00:00.000Z',
    type: 'chord',
    name: 'C progression',
    source: { fileName: 'song.mid', origin: 'midi' },
    range: { startBar: 1, endBar: 4, startTick: 0, endTick: 7680, barCount: 4, complete: true, lengthTicks: 7680 },
    ppq: 480,
    trackIds: ['track-1'],
    notes: [],
    chordProgression: [{ barNumber: 1, value: 'C', confidence: 0.9 }],
    motifs: [],
    tags: { genre: 'J-POP', mood: 'bright', bpm: 120, key: 'C major', custom: ['verse'] },
  };

  await saveClipRecord(clip, { indexedDBFactory });
  const loaded = await getSavedClip('clip-1', { indexedDBFactory });
  assert.equal(loaded.name, 'C progression');

  const list = await listSavedClips({ indexedDBFactory });
  assert.equal(list.length, 1);
  assert.equal(list[0].type, 'chord');

  await deleteSavedClip('clip-1', { indexedDBFactory });
  assert.equal(await getSavedClip('clip-1', { indexedDBFactory }), undefined);
  assert.deepEqual(await listSavedClips({ indexedDBFactory }), []);
});
