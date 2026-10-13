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

test('Analyzer creates a new SongProject v1 that Demo Composer can consume', () => {
  const result = buildSongProjectFromAnalysis(fixtureSong(), fixtureBundle(), {
    projectId: 'analysis-song-1',
    title: 'Reference Analysis',
    now: '2026-10-13T01:00:00.000Z',
  });

  const project = result.project;
  assert.equal(project.kind, 'song-project');
  assert.equal(project.schemaVersion, 1);
  assert.equal(project.projectId, 'analysis-song-1');
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
  assert.equal(project.compatibility.midiAnalyzer.appVersion, 'v0.11-dev');
  assert.equal(project.compatibility.demoComposer.legacyProject.schemaVersion, 3);
  assert.equal(project.compatibility.demoComposer.legacyProject.basic.key, 'E');
});

test('Analyzer merge owns analysis/reference/basic but preserves composition and arrangement', () => {
  const initial = buildSongProjectFromAnalysis(fixtureSong(), fixtureBundle(), {
    projectId: 'analysis-song-2',
    title: 'Existing Song',
    now: '2026-10-13T01:00:00.000Z',
  }).project;

  const existing = structuredClone(initial);
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

  const compositionBefore = structuredClone(existing.composition);
  const arrangementBefore = structuredClone(existing.arrangement);
  const merged = mergeAnalyzerAnalysisIntoSongProject(existing, fixtureSong(), fixtureBundle('A major'), {
    now: '2026-10-13T01:05:00.000Z',
  });

  assert.deepEqual(merged.composition, compositionBefore);
  assert.deepEqual(merged.arrangement, arrangementBefore);
  assert.equal(merged.analysis.keyCandidates[0].value, 'A major');
  assert.equal(merged.basic.key, 'A');
  assert.equal(merged.reference.items[0].name, 'reference.mid');
  assert.equal(merged.updatedAt, '2026-10-13T01:05:00.000Z');
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
