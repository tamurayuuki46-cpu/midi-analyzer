const DB_NAME = 'midi-analyzer';
const DB_VERSION = 1;
const STORE_NAME = 'savedMidis';

export const STORAGE_DB_NAME = DB_NAME;
export const STORAGE_DB_VERSION = DB_VERSION;
export const STORAGE_STORE_NAME = STORE_NAME;

export function isIndexedDbAvailable(indexedDBFactory = globalThis.indexedDB) {
  return Boolean(indexedDBFactory && typeof indexedDBFactory.open === 'function');
}

function requireIndexedDb(indexedDBFactory) {
  if (!isIndexedDbAvailable(indexedDBFactory)) {
    throw new Error('このブラウザでは端末保存（IndexedDB）を利用できません。');
  }
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function transactionToPromise(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.'));
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
  });
}

export function openMidiDatabase(indexedDBFactory = globalThis.indexedDB) {
  requireIndexedDb(indexedDBFactory);

  return new Promise((resolve, reject) => {
    const request = indexedDBFactory.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('savedAt', 'savedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDBを開けませんでした。'));
    request.onblocked = () => reject(new Error('IndexedDBの更新が他のタブによりブロックされています。'));
  });
}

function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `midi-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createSavedMidiRecord({
  file,
  importResult,
  origin = 'midi',
  id = createId(),
  savedAt = new Date().toISOString(),
}) {
  if (!file || typeof file.arrayBuffer !== 'function') {
    throw new TypeError('保存にはFile.arrayBuffer()を利用できるMIDIファイルが必要です。');
  }
  if (!importResult?.song) {
    throw new TypeError('保存には正規化済みのImport Resultが必要です。');
  }

  const midiBytes = await file.arrayBuffer();

  return {
    storageSchemaVersion: 1,
    id,
    savedAt,
    source: {
      fileName: file.name || importResult.song.source?.fileName || 'untitled.mid',
      origin,
      size: Number.isFinite(file.size) ? file.size : midiBytes.byteLength,
      type: file.type || 'audio/midi',
      lastModified: Number.isFinite(file.lastModified) ? file.lastModified : null,
    },
    midiBytes,
    song: importResult.song,
    warnings: Array.isArray(importResult.warnings) ? importResult.warnings : [],
  };
}

async function withStore(mode, operation, indexedDBFactory = globalThis.indexedDB) {
  const db = await openMidiDatabase(indexedDBFactory);
  try {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const result = await operation(store);
    await transactionToPromise(transaction);
    return result;
  } finally {
    db.close();
  }
}

export async function saveImportedMidi(input, options = {}) {
  const record = await createSavedMidiRecord(input);
  await withStore(
    'readwrite',
    (store) => requestToPromise(store.put(record)),
    options.indexedDBFactory,
  );
  return record;
}

export async function getSavedMidi(id, options = {}) {
  return withStore(
    'readonly',
    (store) => requestToPromise(store.get(id)),
    options.indexedDBFactory,
  );
}

export async function deleteSavedMidi(id, options = {}) {
  await withStore(
    'readwrite',
    (store) => requestToPromise(store.delete(id)),
    options.indexedDBFactory,
  );
}

export async function listSavedMidis(options = {}) {
  return withStore(
    'readonly',
    (store) => new Promise((resolve, reject) => {
      const summaries = [];
      const index = store.index('savedAt');
      const request = index.openCursor(null, 'prev');

      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve(summaries);
          return;
        }
        const record = cursor.value;
        summaries.push({
          id: record.id,
          savedAt: record.savedAt,
          source: record.source,
          trackCount: record.song?.tracks?.length ?? 0,
          noteCount: record.song?.notes?.length ?? 0,
          ppq: record.song?.ppq ?? null,
        });
        cursor.continue();
      };
      request.onerror = () => reject(request.error ?? new Error('保存済みMIDI一覧を取得できませんでした。'));
    }),
    options.indexedDBFactory,
  );
}
