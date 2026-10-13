import { buildDemoComposerProject } from './demoComposerAdapter.js';

export const SONG_PROJECT_SCHEMA_VERSION = 1;
export const SONG_PROJECT_KIND = 'song-project';

function clone(value) {
  if (value === undefined) return undefined;
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function nowIso(now) {
  return now || new Date().toISOString();
}

function notesForRole(project, role) {
  return clone(project?.tracks?.find((track) => track.role === role)?.notes ?? []);
}

function analysisFromBundle(bundle) {
  return {
    keyCandidates: clone(bundle?.key?.candidates ?? []),
    chordCandidates: clone(bundle?.chords?.segments ?? []),
    degreeAnalysis: clone(bundle?.topChordProgression ?? null),
    melodyAnalysis: clone(bundle?.melody ?? null),
    bassAnalysis: clone(bundle?.bass ?? null),
    rhythmAnalysis: clone(bundle?.rhythm ?? null),
  };
}

function referenceFromSong(song) {
  const source = clone(song?.source ?? {});
  if (!Object.keys(source).length) return { items: [] };
  return {
    items: [{
      type: 'midi',
      name: source.fileName ?? 'Imported MIDI',
      metadata: source,
    }],
  };
}

function emptyArrangement() {
  return {
    reharmonization: null,
    voicing: null,
    density: null,
    instruments: null,
    selectedAlternatives: null,
    decisions: [],
  };
}

export function buildSongProjectFromAnalysis(song, bundle, options = {}) {
  const demo = buildDemoComposerProject(song, bundle, options);
  const stamp = nowIso(options.now);
  const projectId = options.projectId ?? demo.project.id;

  const songProject = {
    kind: SONG_PROJECT_KIND,
    schemaVersion: SONG_PROJECT_SCHEMA_VERSION,
    projectId,
    title: demo.project.metadata.title,
    createdAt: stamp,
    updatedAt: stamp,
    basic: clone(demo.project.basic),
    analysis: analysisFromBundle(bundle),
    composition: {
      chords: clone(demo.project.chords ?? []),
      melody: notesForRole(demo.project, 'melody'),
      counterMelody: notesForRole(demo.project, 'counter'),
      bass: notesForRole(demo.project, 'bass'),
      drums: notesForRole(demo.project, 'drums'),
      sections: clone(demo.project.structure?.sections ?? []),
    },
    arrangement: emptyArrangement(),
    history: { version: 1, changes: [] },
    reference: referenceFromSong(song),
    export: { lastDraftMidiAt: null, lastSongMidiAt: null },
    compatibility: {
      midiAnalyzer: {
        appVersion: 'v0.9-dev',
        source: clone(song?.source ?? {}),
        warnings: clone(demo.warnings),
        analysisBundle: clone(bundle),
      },
      demoComposer: {
        schemaVersion: demo.project.schemaVersion,
        appVersion: demo.project.appVersion,
        revision: demo.project.revision,
        legacyProject: clone(demo.project),
      },
    },
  };

  return Object.freeze({ project: Object.freeze(songProject), warnings: demo.warnings });
}

export function mergeAnalyzerAnalysisIntoSongProject(songProject, song, bundle, options = {}) {
  if (!songProject || songProject.kind !== SONG_PROJECT_KIND || songProject.schemaVersion !== SONG_PROJECT_SCHEMA_VERSION) {
    throw new Error('Song Project v1ではありません。');
  }

  const next = clone(songProject);
  const compositionBefore = JSON.stringify(next.composition);
  const arrangementBefore = JSON.stringify(next.arrangement);
  const generated = buildSongProjectFromAnalysis(song, bundle, {
    ...options,
    projectId: next.projectId,
    title: next.title,
  });

  next.updatedAt = nowIso(options.now);
  next.analysis = clone(generated.project.analysis);
  next.reference = clone(generated.project.reference);
  next.compatibility = {
    ...(next.compatibility ?? {}),
    midiAnalyzer: clone(generated.project.compatibility.midiAnalyzer),
  };

  if (options.updateBasic !== false) {
    next.basic = {
      ...(next.basic ?? {}),
      bpm: generated.project.basic.bpm,
      key: generated.project.basic.key,
      scale: generated.project.basic.scale,
      timeSignature: generated.project.basic.timeSignature,
      ppq: generated.project.basic.ppq,
    };
  }

  if (JSON.stringify(next.composition) !== compositionBefore) {
    throw new Error('Analyzer merge modified composition unexpectedly.');
  }
  if (JSON.stringify(next.arrangement) !== arrangementBefore) {
    throw new Error('Analyzer merge modified arrangement unexpectedly.');
  }

  return next;
}
