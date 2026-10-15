import { getDefaultMelodyTrackId } from '../basic/index.js';

const PITCH_CLASS_NAMES = Object.freeze(['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']);
const PITCH_CLASS_BY_NAME = Object.freeze(Object.fromEntries(PITCH_CLASS_NAMES.map((name, index) => [name, index])));
const SCALE_INTERVALS = Object.freeze({
  major: Object.freeze([0, 2, 4, 5, 7, 9, 11]),
  minor: Object.freeze([0, 2, 3, 5, 7, 8, 10]),
});
const CHORD_INTERVALS = Object.freeze({
  major: Object.freeze([0, 4, 7]),
  minor: Object.freeze([0, 3, 7]),
  dim: Object.freeze([0, 3, 6]),
  aug: Object.freeze([0, 4, 8]),
  sus2: Object.freeze([0, 2, 7]),
  sus4: Object.freeze([0, 5, 7]),
  7: Object.freeze([0, 4, 7, 10]),
  maj7: Object.freeze([0, 4, 7, 11]),
  m7: Object.freeze([0, 3, 7, 10]),
  m7b5: Object.freeze([0, 3, 6, 10]),
});

function mod(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function pitchClass(pitch) {
  return mod(pitch, 12);
}

function round(value, digits = 4) {
  if (!Number.isFinite(value)) return 0;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function parseKeyValue(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(.+)\s+(major|minor)$/);
  if (!match) return null;
  const root = PITCH_CLASS_BY_NAME[match[1]];
  if (!Number.isInteger(root)) return null;
  return Object.freeze({ value: value.trim(), root, scale: match[2] });
}

function representativeMelodyNotes(song, trackId) {
  if (!trackId) return [];
  const groups = new Map();
  for (const note of song?.notes ?? []) {
    if (note.trackId !== trackId || note.channel === 9 || !(note.durationTick > 0)) continue;
    const bucket = groups.get(note.startTick) ?? [];
    bucket.push(note);
    groups.set(note.startTick, bucket);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, bucket]) => [...bucket].sort((a, b) => b.velocity - a.velocity || b.durationTick - a.durationTick || b.pitch - a.pitch)[0]);
}

function chordContextAtTick(chordSegments, tick) {
  const segment = (chordSegments ?? []).find((entry) => tick >= entry.startTick && tick < entry.endTick);
  if (!segment) return null;
  const selectedCandidate = segment.selectedCandidate
    ?? (segment.selected ? segment.candidates?.find((candidate) => candidate.value === segment.selected) : null);
  const candidate = segment.effectiveCandidate ?? selectedCandidate ?? segment.candidates?.[0] ?? null;
  if (!candidate || !Number.isInteger(candidate.root)) return null;
  return Object.freeze({
    candidate,
    explicit: segment.selectionSource === 'selected' || Boolean(segment.selected || selectedCandidate),
  });
}

function isChordTone(note, context) {
  if (!context) return null;
  const intervals = CHORD_INTERVALS[context.candidate.quality] ?? [0];
  return intervals.includes(mod(pitchClass(note.pitch) - context.candidate.root, 12));
}

function isScaleTone(note, key) {
  if (!key) return null;
  const intervals = SCALE_INTERVALS[key.scale];
  if (!intervals) return null;
  return intervals.includes(mod(pitchClass(note.pitch) - key.root, 12));
}

export function analyzeNoteFunctions(song, options = {}) {
  const trackId = options.trackId ?? getDefaultMelodyTrackId(song);
  const notes = representativeMelodyNotes(song, trackId);
  const key = parseKeyValue(options.keyValue ?? null);

  let scaleEvaluated = 0;
  let scaleToneCount = 0;
  let chordEvaluated = 0;
  let chordToneCount = 0;
  let provisionalChordCount = 0;
  const relationship = { evaluated: 0, both: 0, scaleOnly: 0, chordOnly: 0, outsideBoth: 0 };

  const details = notes.map((note) => {
    const scaleTone = isScaleTone(note, key);
    const chordContext = chordContextAtTick(options.chordSegments, note.startTick);
    const chordTone = isChordTone(note, chordContext);

    if (scaleTone !== null) {
      scaleEvaluated += 1;
      if (scaleTone) scaleToneCount += 1;
    }
    if (chordTone !== null) {
      chordEvaluated += 1;
      if (chordTone) chordToneCount += 1;
      if (!chordContext.explicit) provisionalChordCount += 1;
    }

    let relation = 'unresolved';
    if (scaleTone !== null && chordTone !== null) {
      relationship.evaluated += 1;
      if (scaleTone && chordTone) {
        relationship.both += 1;
        relation = 'both';
      } else if (scaleTone) {
        relationship.scaleOnly += 1;
        relation = 'scale-only';
      } else if (chordTone) {
        relationship.chordOnly += 1;
        relation = 'chord-only';
      } else {
        relationship.outsideBoth += 1;
        relation = 'outside-both';
      }
    }

    return Object.freeze({
      id: note.id ?? null,
      pitch: note.pitch,
      startTick: note.startTick,
      scaleTone,
      chordTone,
      relation,
      chord: chordContext?.candidate?.value ?? null,
      chordSource: chordContext ? (chordContext.explicit ? 'selected' : 'candidate') : null,
    });
  });

  return Object.freeze({
    trackId: trackId ?? null,
    noteCount: notes.length,
    key: key ? Object.freeze({ ...key, source: options.keySource === 'selected' ? 'selected' : 'candidate' }) : null,
    scaleTone: Object.freeze({
      evaluated: scaleEvaluated,
      tone: scaleToneCount,
      nonScaleTone: Math.max(0, scaleEvaluated - scaleToneCount),
      ratio: round(scaleEvaluated ? scaleToneCount / scaleEvaluated : 0),
    }),
    chordTone: Object.freeze({
      evaluated: chordEvaluated,
      tone: chordToneCount,
      nonChordTone: Math.max(0, chordEvaluated - chordToneCount),
      ratio: round(chordEvaluated ? chordToneCount / chordEvaluated : 0),
      provisionalCount: provisionalChordCount,
    }),
    relationship: Object.freeze({ ...relationship }),
    notes: Object.freeze(details),
    note: 'Chord ToneとScale Toneは別の概念です。コード外でもスケール内、コード内でも現在のスケール基準では外側、という状態があります。外音を誤りとは判定しません。',
  });
}

export function parseNoteFunctionKey(value) {
  return parseKeyValue(value);
}
