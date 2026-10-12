const DB_NAME = 'midi-analyzer';
const DB_VERSION = 2;
const STORE_NAME = 'savedMidis';
const CLIP_STORE_NAME = 'savedClips';

export const STORAGE_DB_NAME = DB_NAME;
export const STORAGE_DB_VERSION = DB_VERSION;
export const STORAGE_STORE_NAME = STORE_NAME;
export const STORAGE_CLIP_STORE_NAME = CLIP_STORE_NAME;

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

function ensureMidiStore(db) {
  if (db.objectStoreNames.contains(STORE_NAME)) return;
  const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
  store.createIndex('savedAt', 'savedAt', { unique: false });
}

function ensureClipStore(db) {
  if (db.objectStoreNames.contains(CLIP_STORE_NAME)) return;
  const store = db.createObjectStore(CLIP_STORE_NAME, { keyPath: 'id' });
  store.createIndex('savedAt', 'savedAt', { unique: false });
  store.createIndex('type', 'type', { unique: false });
}

export function openMidiDatabase(indexedDBFactory = globalThis.indexedDB) {
  requireIndexedDb(indexedDBFactory);

  return new Promise((resolve, reject) => {
    const request = indexedDBFactory.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      ensureMidiStore(db);
      ensureClipStore(db);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDBを開けませんでした。'));
    request.onblocked = () => reject(new Error('IndexedDBの更新が他のタブによりブロックされています。'));
  });
}

function createId(prefix = 'midi') {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createSavedMidiRecord({
  file,
  importResult,
  origin = 'midi',
  id = createId('midi'),
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

async function withStore(storeName, mode, operation, indexedDBFactory = globalThis.indexedDB) {
  const db = await openMidiDatabase(indexedDBFactory);
  try {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
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
    STORE_NAME,
    'readwrite',
    (store) => requestToPromise(store.put(record)),
    options.indexedDBFactory,
  );
  return record;
}

export async function getSavedMidi(id, options = {}) {
  return withStore(
    STORE_NAME,
    'readonly',
    (store) => requestToPromise(store.get(id)),
    options.indexedDBFactory,
  );
}

export async function deleteSavedMidi(id, options = {}) {
  await withStore(
    STORE_NAME,
    'readwrite',
    (store) => requestToPromise(store.delete(id)),
    options.indexedDBFactory,
  );
}

export async function listSavedMidis(options = {}) {
  return withStore(
    STORE_NAME,
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

function validateClipRecord(record) {
  if (!record || typeof record !== 'object') throw new TypeError('Clip recordが必要です。');
  if (!record.id || !record.type || !record.savedAt) throw new TypeError('Clip recordのid / type / savedAtが不足しています。');
  return record;
}

export async function saveClipRecord(record, options = {}) {
  validateClipRecord(record);
  await withStore(
    CLIP_STORE_NAME,
    'readwrite',
    (store) => requestToPromise(store.put(record)),
    options.indexedDBFactory,
  );
  return record;
}

export async function getSavedClip(id, options = {}) {
  return withStore(
    CLIP_STORE_NAME,
    'readonly',
    (store) => requestToPromise(store.get(id)),
    options.indexedDBFactory,
  );
}

export async function deleteSavedClip(id, options = {}) {
  await withStore(
    CLIP_STORE_NAME,
    'readwrite',
    (store) => requestToPromise(store.delete(id)),
    options.indexedDBFactory,
  );
}

export async function listSavedClips(options = {}) {
  return withStore(
    CLIP_STORE_NAME,
    'readonly',
    (store) => new Promise((resolve, reject) => {
      const records = [];
      const index = store.index('savedAt');
      const request = index.openCursor(null, 'prev');
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve(records);
          return;
        }
        records.push(cursor.value);
        cursor.continue();
      };
      request.onerror = () => reject(request.error ?? new Error('Clip Libraryを取得できませんでした。'));
    }),
    options.indexedDBFactory,
  );
}
