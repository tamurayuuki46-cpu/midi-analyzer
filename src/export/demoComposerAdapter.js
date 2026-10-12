import { degreeForPitchClass } from '../analysis/chord/index.js';

const DEMO_KEY_NAMES = Object.freeze(['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']);
const QUALITY_MAP = Object.freeze({
  major: 'major',
  minor: 'minor',
  dim: 'diminished',
  aug: 'augmented',
  sus2: 'sus2',
  sus4: 'sus4',
  7: 'dominant7',
  maj7: 'major7',
  m7: 'minor7',
  m7b5: 'minor7flat5',
});

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function fileTitle(fileName) {
  const value = String(fileName || 'MIDI Analyzer Import');
  return value.replace(/\.(mid|midi)$/i, '') || 'MIDI Analyzer Import';
}

function parseKeyCandidate(value) {
  const match = typeof value === 'string' ? value.match(/^(.+?)\s+(major|minor)$/) : null;
  if (!match) return null;
  const analyzerNames = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
  const index = analyzerNames.indexOf(match[1]);
  if (index < 0) return null;
  return { pitchClass: index, key: DEMO_KEY_NAMES[index], scale: match[2] };
}

function scaleTick(value, ratio, minimum = 0) {
  if (!Number.isFinite(value)) return minimum;
  return Math.max(minimum, Math.round(value * ratio));
}

function toDemoNotes(notes, ratio, prefix) {
  return notes
    .filter((note) => Number.isFinite(note.pitch) && note.durationTick > 0)
    .map((note, index) => ({
      id: `${prefix}-${index + 1}-${scaleTick(note.startTick, ratio)}`,
      pitch: clamp(Math.round(note.pitch), 0, 127),
      startTick: scaleTick(note.startTick, ratio),
      durationTick: scaleTick(note.durationTick, ratio, 1),
      velocity: clamp(Math.round(note.velocity || 96), 1, 127),
    }));
}

function roleTrack(song, role, ids, ratio) {
  const set = new Set(ids.filter(Boolean));
  if (!set.size) return null;
  const channel = { melody: 2, bass: 3, counter: 4, drums: 10 }[role];
  const name = { melody: 'Melody', bass: 'Bass', counter: 'Counter Melody', drums: 'Drums' }[role];
  const notes = toDemoNotes((song.notes ?? []).filter((note) => set.has(note.trackId)), ratio, role);
  if (!notes.length) return null;
  const result = {
    role,
    name,
    midiChannel: channel,
    instrumentId: null,
    mute: false,
    solo: false,
    volume: 1,
    pan: 0,
    notes,
  };
  if (role === 'drums') result.drumMap = { kick: 36, snare: 38, closedHH: 42 };
  return result;
}

export function buildDemoComposerProject(song, bundle, options = {}) {
  const ppq = Number(song?.ppq) || 480;
  const ratio = 480 / ppq;
  const topKey = parseKeyCandidate(bundle?.key?.candidates?.[0]?.value);
  const effectiveKey = topKey ?? { pitchClass: 0, key: 'C', scale: 'major' };
  const sourceMeter = bundle?.song?.timeSignature ?? '4/4';
  const warnings = [];
  if (!topKey) warnings.push('Key候補を取得できなかったため、Demo Composer側はC majorで初期化しています。');
  if (sourceMeter !== '4/4') warnings.push(`元MIDIは${sourceMeter}ですが、Demo Composer現行Schemaは4/4固定です。`);
  if (ppq !== 480) warnings.push(`元MIDI PPQ ${ppq} をDemo Composer PPQ 480へ比例変換しました。`);

  const chords = (bundle?.chords?.segments ?? []).flatMap((segment) => {
    const candidate = segment.effectiveCandidate ?? segment.candidates?.[0] ?? null;
    if (!candidate || !Number.isInteger(candidate.root)) return [];
    const quality = QUALITY_MAP[candidate.quality];
    if (!quality) return [];
    const degreeInfo = degreeForPitchClass(candidate.root, bundle?.key?.candidates?.[0]?.value ?? '');
    return [{
      root: candidate.root,
      quality,
      degree: degreeInfo?.value ?? '',
      startTick: scaleTick(segment.startTick, ratio),
      durationTick: scaleTick(segment.endTick - segment.startTick, ratio, 1),
    }];
  });

  const melodyId = bundle?.melody?.trackId ?? null;
  const bassId = bundle?.bass?.trackId ?? null;
  const counterId = bundle?.deep?.counterMelody?.counterTrackId ?? null;
  const drumIds = (song?.tracks ?? [])
    .filter((track) => track.isDrums || track.roleHint === 'drums')
    .map((track) => track.id);
  const tracks = [
    roleTrack(song, 'melody', [melodyId], ratio),
    roleTrack(song, 'counter', counterId && counterId !== melodyId ? [counterId] : [], ratio),
    roleTrack(song, 'bass', [bassId], ratio),
    roleTrack(song, 'drums', drumIds, ratio),
  ].filter(Boolean);

  const memoLines = [
    'MIDI Analyzerから生成したDemo Composer互換Projectです。',
    'Key / Chord / Track役割は解析候補を元にした初期値です。必要に応じてDemo Composer側で選び直してください。',
    ...warnings.map((warning) => `注意: ${warning}`),
  ];

  const project = {
    schemaVersion: 3,
    appVersion: 'v0.9-dev',
    id: options.id ?? `midi-analyzer-${Date.now()}`,
    revision: 1,
    metadata: {
      title: options.title ?? fileTitle(song?.source?.fileName),
      genre: '',
      mood: [],
      memo: memoLines.join('\n'),
      composition: {
        hook: '',
        highlight: '',
        tension: '',
        chorus: '',
        reference: song?.source?.fileName ?? '',
        axes: { melody: '', counter: '', harmony: '', rhythm: '', sound: '' },
        tags: { melody: [], counter: [] },
        checks: { counter: 'undecided', sound: 'undecided', contrast: 'undecided' },
        decisions: [],
      },
    },
    basic: {
      bpm: clamp(Math.round(Number(song?.tempoMap?.[0]?.bpm) || 120), 40, 240),
      key: effectiveKey.key,
      scale: effectiveKey.scale,
      timeSignature: '4/4',
      ppq: 480,
    },
    structure: { sections: [] },
    chords,
    tracks,
    instruments: [],
    progress: {},
    exportSettings: {},
  };

  return Object.freeze({ project: Object.freeze(project), warnings: Object.freeze(warnings) });
}
