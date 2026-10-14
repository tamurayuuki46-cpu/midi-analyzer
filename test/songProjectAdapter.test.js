import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSongProjectFromAnalysis, mergeAnalyzerAnalysisIntoSongProject, mergeReferenceMetadata } from '../src/export/songProjectAdapter.js';

function fixtureSong() {
  return {
    source: { fileName: 'reference.mid', fileSize: 1234 },
    ppq: 480,
    lengthTicks: 3840,
    tempoMap: [{ tick: 0, bpm: 126 }],
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
    tracks: [
      { id: 'melody-track', isDrums: false },
      { id: 'bass-track', isDrums: false },
      { id: 'drums-track', isDrums: true },
    ],
    notes: [
      { trackId: 'melody-track', pitch: 64, startTick: 0, durationTick: 480, velocity: 100 },
      { trackId: 'melody-track', pitch: 66, startTick: 480, durationTick: 480, velocity: 96 },
      { trackId: 'bass-track', pitch: 40, startTick: 0, durationTick: 960, velocity: 92 },
      { trackId: 'drums-track', pitch: 36, startTick: 0, durationTick: 120, velocity: 110 },
    ],
  };
}

function fixtureBundle(key = 'E major') {
  return {
    generatedBy: 'midi-analyzer',
    schemaVersion: 1,
    source: { fileName: 'reference.mid' },
    song: { ppq: 480, lengthTicks: 3840, trackCount: 3, noteCount: 4, tempo: 126, timeSignature: '4/4' },
    key: { candidates: [{ value: key, confidence: 0.91 }] },
    chords: {
      segments: [
        { startTick: 0, endTick: 1920, candidates: [{ root: 4, quality: 'major' }], effectiveCandidate: { root: 4, quality: 'major' } },
        { startTick: 1920, endTick: 3840, candidates: [{ root: 11, quality: 'major' }], effectiveCandidate: { root: 11, quality: 'major' } },
      ],
    },
    topChordProgression: { degrees: ['I', 'V'], text: 'I - V' },
    melody: { trackId: 'melody-track', range: { min: 64, max: 66 } },
    bass: { trackId: 'bass-track', range: { min: 40, max: 40 } },
    rhythm: { noteDensity: 1.25 },
    motif: { candidates: [] },
    structure: { sections: [] },
    deep: { counterMelody: { counterTrackId: null } },
  };
}

test('Analyzer creates a canonical SongProject v1 that the app family can consume', () => {
  const result = buildSongProjectFromAnalysis(fixtureSong(), fixtureBundle(), {
    projectId: 'analysis-song-1',
    title: 'Reference Analysis',
    now: '2026-10-13T01:00:00.000Z',
  });

  const project = result.project;
  assert.equal(project.kind, 'song-project');
  assert.equal(project.schemaVersion, 1);
  assert.equal(project.projectId, 'analysis-song-1');
  assert.equal(project.lineage.rootProjectId, 'analysis-song-1');
  assert.equal(project.lineage.sourceApp, 'midi-analyzer');
  assert.equal(project.lineage.createdFrom, 'analysis-import');
  assert.deepEqual(project.intent.references, []);
  assert.deepEqual(project.assets.files, []);
  assert.equal(project.export.lastDawHandoffAt, null);
  assert.equal(project.basic.bpm, 126);
  assert.equal(project.basic.key, 'E');
  assert.equal(project.basic.scale, 'major');
  assert.equal(project.analysis.keyCandidates[0].value, 'E major');
  assert.equal(project.analysis.chordCandidates.length, 2);
  assert.equal(project.composition.chords.length, 2);
  assert.equal(project.composition.melody.length, 2);
  assert.equal(project.composition.bass.length, 1);
  assert.equal(project.composition.drums.length, 1);
  assert.equal(project.reference.items[0].type, 'midi');
  assert.equal(project.reference.items[0].name, 'reference.mid');
  assert.equal(project.compatibility.midiAnalyzer.appVersion, 'v0.17-dev');
  assert.equal(project.compatibility.demoComposer.legacyProject.schemaVersion, 3);
  assert.equal(project.compatibility.demoComposer.legacyProject.basic.key, 'E');
});

test('Analyzer merge owns analysis/reference and preserves sheet/composition/arrangement/assets/basic by default', () => {
  const initial = buildSongProjectFromAnalysis(fixtureSong(), fixtureBundle(), {
    projectId: 'analysis-song-2',
    title: 'Existing Song',
    now: '2026-10-13T01:00:00.000Z',
  }).project;

  const existing = structuredClone(initial);
  existing.intent = {
    scene: '夜の帰り道', purpose: '', references: [{ title: 'Ref Song', artist: 'Ref Artist', note: '' }],
    genre: ['J-POP'], mood: ['浮遊感'], constraints: [], experiments: [],
    vocal: { isVocalSong: true, lyricsTheme: '前進', lyricalImage: '', direction: '', range: { low: null, high: null, note: '' } },
    notes: '作曲シートで決めた内容',
  };
  existing.basic = { ...existing.basic, bpm: 140, key: 'C', scale: 'major' };
  existing.composition = {
    chords: [{ root: 0, quality: 'major', degree: 'I', startTick: 0, durationTick: 1920 }],
    melody: [{ id: 'user-melody', pitch: 72, startTick: 0, durationTick: 480, velocity: 100 }],
    counterMelody: [],
    bass: [],
    drums: [],
    sections: [{ id: 'chorus', name: 'サビ', bars: 8 }],
  };
  existing.arrangement = {
    reharmonization: [{ sectionId: 'chorus', value: 'keep' }],
    voicing: null,
    density: [{ sectionId: 'chorus', density: 'full' }],
    instruments: null,
    selectedAlternatives: { id: 'B' },
    decisions: [{ sectionId: 'chorus', reason: 'keep decision' }],
  };
  existing.assets = { files: [{ id: 'audio-1', type: 'audio', role: 'reference', name: 'ref.wav', path: 'assets/ref.wav', external: true }] };
  existing.reference.items.unshift({ id: 'sheet-ref', type: 'reference', name: '作曲シート参考曲' });

  const before = {
    lineage: structuredClone(existing.lineage),
    intent: structuredClone(existing.intent),
    basic: structuredClone(existing.basic),
    composition: structuredClone(existing.composition),
    arrangement: structuredClone(existing.arrangement),
    history: structuredClone(existing.history),
    assets: structuredClone(existing.assets),
    export: structuredClone(existing.export),
  };
  const merged = mergeAnalyzerAnalysisIntoSongProject(existing, fixtureSong(), fixtureBundle('A major'), {
    now: '2026-10-13T01:05:00.000Z',
  });

  assert.deepEqual(merged.lineage, before.lineage);
  assert.deepEqual(merged.intent, before.intent);
  assert.deepEqual(merged.basic, before.basic, 'existing BPM/Key must not be overwritten by analysis by default');
  assert.deepEqual(merged.composition, before.composition);
  assert.deepEqual(merged.arrangement, before.arrangement);
  assert.deepEqual(merged.history, before.history);
  assert.deepEqual(merged.assets, before.assets);
  assert.deepEqual(merged.export, before.export);
  assert.equal(merged.analysis.keyCandidates[0].value, 'A major');
  assert.equal(merged.reference.items.some((item) => item.id === 'sheet-ref'), true, 'existing references must survive');
  assert.equal(merged.reference.items.some((item) => item.name === 'reference.mid'), true, 'analyzed MIDI reference must be added');
  assert.equal(merged.updatedAt, '2026-10-13T01:05:00.000Z');
});

test('Analyzer can explicitly update basic metadata when creating/importing by choice', () => {
  const initial = buildSongProjectFromAnalysis(fixtureSong(), fixtureBundle(), {
    projectId: 'analysis-song-basic',
    now: '2026-10-13T01:00:00.000Z',
  }).project;
  const existing = structuredClone(initial);
  existing.basic = { ...existing.basic, bpm: 90, key: 'C', scale: 'minor' };
  const merged = mergeAnalyzerAnalysisIntoSongProject(existing, fixtureSong(), fixtureBundle('A major'), { updateBasic: true });
  assert.equal(merged.basic.bpm, 126);
  assert.equal(merged.basic.key, 'A');
  assert.equal(merged.basic.scale, 'major');
});

test('reference metadata can be appended without embedding audio or changing composition', () => {
  const initial = buildSongProjectFromAnalysis(fixtureSong(), fixtureBundle(), {
    projectId: 'analysis-song-3',
    now: '2026-10-13T01:00:00.000Z',
  }).project;
  const compositionBefore = structuredClone(initial.composition);
  const stemReference = {
    id: 'stem-1',
    type: 'stem',
    stemType: 'bass',
    name: 'Bass Stem',
    storage: { kind: 'indexeddb', database: 'midi-analyzer-stems', recordId: 'stem-1' },
  };
  const merged = mergeReferenceMetadata(initial, [stemReference], { now: '2026-10-13T01:10:00.000Z' });
  assert.deepEqual(merged.composition, compositionBefore);
  assert.equal(merged.reference.items.length, 2);
  assert.equal(merged.reference.items[1].stemType, 'bass');
  assert.equal('blob' in merged.reference.items[1], false);
  assert.equal(merged.updatedAt, '2026-10-13T01:10:00.000Z');

  const deduped = mergeReferenceMetadata(merged, [{ ...stemReference, conversionStatus: 'converted' }]);
  assert.equal(deduped.reference.items.length, 2);
  assert.equal(deduped.reference.items[1].conversionStatus, 'converted');
});
