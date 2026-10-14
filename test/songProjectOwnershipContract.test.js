import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSongProjectFromAnalysis,
  mergeAnalyzerAnalysisIntoSongProject,
  mergeReferenceMetadata,
} from '../src/export/songProjectAdapter.js';

function songFixture() {
  return {
    source: { fileName: 'analysis-source.mid', fileSize: 2048 },
    ppq: 480,
    lengthTicks: 1920,
    tempoMap: [{ tick: 0, bpm: 126 }],
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
    tracks: [{ id: 'melody', isDrums: false }],
    notes: [{ trackId: 'melody', pitch: 64, startTick: 0, durationTick: 480, velocity: 96 }],
  };
}

function bundleFixture(key = 'E major') {
  return {
    key: { candidates: [{ value: key, confidence: 0.9 }] },
    chords: { segments: [] },
    topChordProgression: null,
    melody: { trackId: 'melody', range: { min: 64, max: 64 } },
    bass: null,
    rhythm: { noteDensity: 0.5 },
  };
}

function seededProject() {
  const project = structuredClone(buildSongProjectFromAnalysis(songFixture(), bundleFixture(), {
    projectId: 'ownership-contract-midi',
    title: 'Ownership Contract MIDI',
    now: '2026-10-15T00:00:00.000Z',
  }).project);

  project.intent = { ...project.intent, scene: 'keep-intent', notes: 'sheet owned' };
  project.basic = { ...project.basic, bpm: 140, key: 'C', scale: 'minor' };
  project.composition = {
    chords: [{ root: 0, quality: 'major', startTick: 0, durationTick: 1920 }],
    melody: [{ id: 'user-note', pitch: 72, startTick: 0, durationTick: 480, velocity: 100 }],
    counterMelody: [], bass: [], drums: [],
    sections: [{ id: 'chorus', name: 'サビ', bars: 8 }],
  };
  project.arrangement = {
    reharmonization: [{ sectionId: 'chorus', value: 'keep' }],
    voicing: null,
    density: [{ sectionId: 'chorus', density: 'full' }],
    instruments: null,
    selectedAlternatives: { id: 'B' },
    decisions: [{ sectionId: 'chorus', reason: 'keep decision' }],
  };
  project.history = { version: 1, changes: [{ type: 'user-edit' }] };
  project.assets = { files: [{ id: 'asset-1', type: 'audio', name: 'ref.wav', external: true }] };
  project.export = { lastDraftMidiAt: '2026-10-14T10:00:00.000Z', lastSongMidiAt: null, lastDawHandoffAt: null };
  project.reference.items.unshift({ id: 'sheet-ref', type: 'reference', name: 'Sheet reference' });
  return project;
}

test('Analyzer only owns analysis/reference and preserves every protected SongProject v1 area by default', () => {
  const existing = seededProject();
  const protectedAreas = {
    lineage: structuredClone(existing.lineage),
    intent: structuredClone(existing.intent),
    basic: structuredClone(existing.basic),
    composition: structuredClone(existing.composition),
    arrangement: structuredClone(existing.arrangement),
    history: structuredClone(existing.history),
    assets: structuredClone(existing.assets),
    export: structuredClone(existing.export),
  };

  const merged = mergeAnalyzerAnalysisIntoSongProject(existing, songFixture(), bundleFixture('A major'), {
    now: '2026-10-15T00:05:00.000Z',
  });

  for (const [key, expected] of Object.entries(protectedAreas)) {
    assert.deepEqual(merged[key], expected, `Analyzer must preserve ${key}`);
  }
  assert.equal(merged.analysis.keyCandidates[0].value, 'A major');
  assert.equal(merged.reference.items.some((item) => item.id === 'sheet-ref'), true);
  assert.equal(merged.reference.items.some((item) => item.name === 'analysis-source.mid'), true);
});

test('reference-only merge retains composition/arrangement/intent/assets/export and never embeds a blob', () => {
  const existing = seededProject();
  const before = {
    intent: structuredClone(existing.intent),
    composition: structuredClone(existing.composition),
    arrangement: structuredClone(existing.arrangement),
    assets: structuredClone(existing.assets),
    export: structuredClone(existing.export),
  };

  const merged = mergeReferenceMetadata(existing, [{
    id: 'stem-1',
    type: 'stem',
    name: 'Bass Stem',
    storage: { kind: 'indexeddb', database: 'midi-analyzer-stems', recordId: 'stem-1' },
  }], { now: '2026-10-15T00:06:00.000Z' });

  for (const [key, expected] of Object.entries(before)) {
    assert.deepEqual(merged[key], expected, `reference merge must preserve ${key}`);
  }
  const stem = merged.reference.items.find((item) => item.id === 'stem-1');
  assert.ok(stem);
  assert.equal(Object.hasOwn(stem, 'blob'), false);
});

test('Analyzer rejects non-v1 SongProject input before mutating anything', () => {
  const invalid = seededProject();
  invalid.schemaVersion = 2;
  assert.throws(
    () => mergeAnalyzerAnalysisIntoSongProject(invalid, songFixture(), bundleFixture()),
    /Song Project v1/,
  );
  assert.throws(
    () => mergeReferenceMetadata(invalid, []),
    /Song Project v1/,
  );
});
