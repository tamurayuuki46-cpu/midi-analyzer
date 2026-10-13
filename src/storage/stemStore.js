const DB_NAME = 'midi-analyzer-stems';
const DB_VERSION = 1;
const STORE = 'stems';

export const STEM_SOURCE_TYPES = Object.freeze([
  'moises',
  'ripx',
  'self',
  'reference',
  'other',
  'unknown',
]);

function openDb() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error('IndexedDBを利用できません。'));
      return;
    }
    const request = globalThis.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
        store.createIndex('type', 'type');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Stem DBを開けませんでした。'));
  });
}

function waitRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB操作に失敗しました。'));
  });
}

function waitTx(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Stem保存に失敗しました。'));
    tx.onabort = () => reject(tx.error || new Error('Stem保存が中断されました。'));
  });
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `stem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeStemProvenance(provenance = {}, fallbackSource = 'user-import') {
  const requestedType = String(provenance.type || '').trim();
  const type = STEM_SOURCE_TYPES.includes(requestedType)
    ? requestedType
    : (String(fallbackSource).toLowerCase().includes('moises') ? 'moises' : 'unknown');
  return Object.freeze({
    type,
    sourceTitle: String(provenance.sourceTitle || '').trim(),
    sourceProjectId: String(provenance.sourceProjectId || '').trim() || null,
    importedFrom: String(provenance.importedFrom || fallbackSource || 'user-import'),
  });
}

export async function saveStemFile(file, {
  type = 'other',
  name = file?.name || 'Stem',
  duration = null,
  source = 'user-import',
  provenance = {},
} = {}) {
  if (!file) throw new Error('Stemファイルがありません。');
  const db = await openDb();
  try {
    const now = new Date().toISOString();
    const record = {
      id: createId(),
      name,
      type,
      sourceFileName: file.name,
      mimeType: file.type || null,
      size: file.size,
      duration,
      conversionStatus: 'not-converted',
      analysisStatus: 'not-analyzed',
      source,
      provenance: normalizeStemProvenance(provenance, source),
      createdAt: now,
      updatedAt: now,
      blob: file,
    };
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(record);
    await waitTx(tx);
    const { blob, ...metadata } = record;
    return metadata;
  } finally {
    db.close();
  }
}

export async function listStemMetadata() {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readonly');
    const records = await waitRequest(tx.objectStore(STORE).getAll());
    return records
      .map(({ blob, ...item }) => item)
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  } finally {
    db.close();
  }
}

export async function getStem(idValue) {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readonly');
    return await waitRequest(tx.objectStore(STORE).get(idValue));
  } finally {
    db.close();
  }
}

export async function updateStemStatus(idValue, changes = {}) {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const current = await waitRequest(store.get(idValue));
    if (!current) throw new Error('Stemが見つかりません。');
    const next = { ...current, ...changes, id: current.id, blob: current.blob, updatedAt: new Date().toISOString() };
    store.put(next);
    await waitTx(tx);
    const { blob, ...metadata } = next;
    return metadata;
  } finally {
    db.close();
  }
}

export function stemToReferenceMetadata(stem) {
  return {
    id: stem.id,
    type: 'stem',
    stemType: stem.type,
    name: stem.name,
    sourceFileName: stem.sourceFileName,
    duration: stem.duration ?? null,
    conversionStatus: stem.conversionStatus,
    analysisStatus: stem.analysisStatus,
    provenance: stem.provenance ?? normalizeStemProvenance({}, stem.source),
    storage: { kind: 'indexeddb', database: DB_NAME, recordId: stem.id },
  };
}

export const STEM_TYPES = Object.freeze(['vocal', 'bass', 'piano', 'guitar', 'drums', 'other']);
