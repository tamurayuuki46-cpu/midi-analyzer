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

function emptyIntent() {
  return {
    scene: '',
    purpose: '',
    references: [],
    genre: [],
    mood: [],
    constraints: [],
    experiments: [],
    vocal: {
      isVocalSong: null,
      lyricsTheme: '',
      lyricalImage: '',
      direction: '',
      range: { low: null, high: null, note: '' },
    },
    notes: '',
  };
}

function createLineage(projectId) {
  return {
    rootProjectId: projectId,
    parentProjectId: null,
    sourceApp: 'midi-analyzer',
    createdFrom: 'analysis-import',
    forkReason: null,
    revision: 1,
  };
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

function referenceKey(item) {
  return item?.id || item?.storage?.recordId || `${item?.type || 'reference'}:${item?.name || item?.sourceFileName || ''}`;
}

function mergedReference(baseReference, incomingReference) {
  const existing = Array.isArray(baseReference?.items) ? baseReference.items : [];
  const incoming = Array.isArray(incomingReference?.items) ? incomingReference.items : [];
  const items = new Map(existing.map((item) => [referenceKey(item), clone(item)]));
  for (const item of incoming) items.set(referenceKey(item), clone(item));
  return { ...(clone(baseReference) || {}), items: [...items.values()] };
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

export function isSongProject(value) {
  return Boolean(value && value.kind === SONG_PROJECT_KIND && value.schemaVersion === SONG_PROJECT_SCHEMA_VERSION);
}

export function buildSongProjectFromAnalysis(song, bundle, options = {}) {
  const demo = buildDemoComposerProject(song, bundle, options);
  const stamp = nowIso(options.now);
  const projectId = options.projectId ?? demo.project.id;

  const songProject = {
    kind: SONG_PROJECT_KIND,
    schemaVersion: SONG_PROJECT_SCHEMA_VERSION,
    projectId,
    title: options.title ?? demo.project.metadata.title,
    createdAt: stamp,
    updatedAt: stamp,
    lineage: createLineage(projectId),
    intent: emptyIntent(),
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
    assets: { files: [] },
    export: { lastDraftMidiAt: null, lastSongMidiAt: null, lastDawHandoffAt: null },
    compatibility: {
      midiAnalyzer: {
        appVersion: 'v0.16-dev',
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

export function mergeReferenceMetadata(songProject, items = [], options = {}) {
  if (!isSongProject(songProject)) throw new Error('Song Project v1ではありません。');
  const next = clone(songProject);
  next.reference = mergedReference(next.reference, { items });
  next.updatedAt = nowIso(options.now);
  return next;
}

export function mergeAnalyzerAnalysisIntoSongProject(songProject, song, bundle, options = {}) {
  if (!isSongProject(songProject)) throw new Error('Song Project v1ではありません。');

  const next = clone(songProject);
  const preserved = {
    lineage: clone(next.lineage),
    intent: clone(next.intent),
    composition: clone(next.composition),
    arrangement: clone(next.arrangement),
    history: clone(next.history),
    assets: clone(next.assets),
    export: clone(next.export),
  };
  const generated = buildSongProjectFromAnalysis(song, bundle, {
    ...options,
    projectId: next.projectId,
    title: next.title,
  });

  next.updatedAt = nowIso(options.now);
  next.analysis = clone(generated.project.analysis);
  next.reference = mergedReference(next.reference, generated.project.reference);
  next.compatibility = {
    ...(next.compatibility ?? {}),
    midiAnalyzer: clone(generated.project.compatibility.midiAnalyzer),
  };

  if (options.updateBasic === true) {
    next.basic = {
      ...(next.basic ?? {}),
      bpm: generated.project.basic.bpm,
      key: generated.project.basic.key,
      scale: generated.project.basic.scale,
      timeSignature: generated.project.basic.timeSignature,
      ppq: generated.project.basic.ppq,
    };
  }

  for (const [key, before] of Object.entries(preserved)) {
    if (JSON.stringify(next[key]) !== JSON.stringify(before)) {
      throw new Error(`Analyzer merge modified ${key} unexpectedly.`);
    }
  }

  return next;
}
