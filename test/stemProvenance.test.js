import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeStemProvenance, stemToReferenceMetadata } from '../src/storage/stemStore.js';

test('normalizeStemProvenance keeps explicit source metadata', () => {
  const value = normalizeStemProvenance({
    type: 'moises',
    sourceTitle: 'Reference Song A',
    sourceProjectId: 'project-1',
  }, 'moises-import');
  assert.deepEqual(value, {
    type: 'moises',
    sourceTitle: 'Reference Song A',
    sourceProjectId: 'project-1',
    importedFrom: 'moises-import',
  });
});

test('normalizeStemProvenance infers Moises from legacy source', () => {
  assert.equal(normalizeStemProvenance({}, 'moises-import').type, 'moises');
  assert.equal(normalizeStemProvenance({}, 'user-import').type, 'unknown');
});

test('legacy stem without provenance still converts to reference metadata', () => {
  const metadata = stemToReferenceMetadata({
    id: 'stem-1',
    type: 'bass',
    name: 'Bass',
    sourceFileName: 'bass.wav',
    duration: 12,
    conversionStatus: 'not-converted',
    analysisStatus: 'not-analyzed',
    source: 'moises-import',
  });
  assert.equal(metadata.provenance.type, 'moises');
  assert.equal(metadata.storage.recordId, 'stem-1');
});
