import { getDefaultMelodyTrackId } from '../basic/index.js';

const PITCH_CLASS_NAMES = Object.freeze(['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']);
const PITCH_CLASS_BY_NAME = Object.freeze(Object.fromEntries(PITCH_CLASS_NAMES.map((name, index) => [name, index])));
const SCALE_INTERVALS = Object.freeze({
  major: Object.freeze([0, 2, 4, 5, 7, 9, 11]),
  'natural-minor': Object.freeze([0, 2, 3, 5, 7, 8, 10]),
  'harmonic-minor': Object.freeze([0, 2, 3, 5, 7, 8, 11]),
  'melodic-minor': Object.freeze([0, 2, 3, 5, 7, 9, 11]),
});
const SCALE_LABELS = Object.freeze({
  major: 'Major',
  'natural-minor': 'Natural Minor',
  'harmonic-minor': 'Harmonic Minor',
  'melodic-minor': 'Melodic Minor (ascending)',
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
const MINOR_SCALE_MODES = new Set(['natural-minor', 'harmonic-minor', 'melodic-minor']);

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

function resolveScaleBasis(key, requestedMode) {
  if (!key) return null;
  if (key.scale === 'major') {
    return Object.freeze({ id: 'major', label: SCALE_LABELS.major, intervals: SCALE_INTERVALS.major });
  }
  const id = MINOR_SCALE_MODES.has(requestedMode) ? requestedMode : 'natural-minor';
  return Object.freeze({ id, label: SCALE_LABELS[id], intervals: SCALE_INTERVALS[id] });
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

function isScaleTone(note, key, scaleBasis) {
  if (!key || !scaleBasis) return null;
  return scaleBasis.intervals.includes(mod(pitchClass(note.pitch) - key.root, 12));
}

function isStep(interval) {
  const size = Math.abs(interval);
  return size >= 1 && size <= 2;
}

function isLocalMotion(previous, current, next, ppq) {
  const maxGap = Math.max(1, ppq) * 2;
  return current.startTick > previous.startTick
    && next.startTick > current.startTick
    && current.startTick - previous.startTick <= maxGap
    && next.startTick - current.startTick <= maxGap;
}

function classifyNonChordFunction(details, index, ppq) {
  const current = details[index];
  if (!current || current.chordTone !== false) return current?.chordTone === true ? 'chord-tone' : 'unresolved';

  const previous = details[index - 1] ?? null;
  const next = details[index + 1] ?? null;
  if (!previous || !next || !isLocalMotion(previous, current, next, ppq)) return 'other-non-chord';

  const into = current.pitch - previous.pitch;
  const out = next.pitch - current.pitch;
  const surroundedByChordTones = previous.chordTone === true && next.chordTone === true;

  if (surroundedByChordTones && previous.pitch === next.pitch && isStep(into) && out === -into) {
    return 'neighbor-candidate';
  }

  if (surroundedByChordTones && isStep(into) && isStep(out) && Math.sign(into) === Math.sign(out)) {
    return 'passing-candidate';
  }

  if (next.chordTone === true && isStep(out)) {
    return 'approach-candidate';
  }

  return 'other-non-chord';
}

export function analyzeNoteFunctions(song, options = {}) {
  const trackId = options.trackId ?? getDefaultMelodyTrackId(song);
  const notes = representativeMelodyNotes(song, trackId);
  const key = parseKeyValue(options.keyValue ?? null);
  const scaleBasis = resolveScaleBasis(key, options.scaleMode);
  const ppq = Number(song?.ppq) || 480;

  let scaleEvaluated = 0;
  let scaleToneCount = 0;
  let chordEvaluated = 0;
  let chordToneCount = 0;
  let provisionalChordCount = 0;
  const relationship = { evaluated: 0, both: 0, scaleOnly: 0, chordOnly: 0, outsideBoth: 0 };

  const details = notes.map((note) => {
    const scaleTone = isScaleTone(note, key, scaleBasis);
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

    return {
      id: note.id ?? null,
      trackId,
      pitch: note.pitch,
      startTick: note.startTick,
      durationTick: note.durationTick,
      scaleTone,
      chordTone,
      relation,
      chord: chordContext?.candidate?.value ?? null,
      chordSource: chordContext ? (chordContext.explicit ? 'selected' : 'candidate') : null,
      functionCandidate: 'unresolved',
    };
  });

  const nonChordFunction = {
    evaluated: 0,
    passing: 0,
    neighbor: 0,
    approach: 0,
    other: 0,
  };

  details.forEach((detail, index) => {
    const functionCandidate = classifyNonChordFunction(details, index, ppq);
    detail.functionCandidate = functionCandidate;
    if (detail.chordTone !== false) return;
    nonChordFunction.evaluated += 1;
    if (functionCandidate === 'passing-candidate') nonChordFunction.passing += 1;
    else if (functionCandidate === 'neighbor-candidate') nonChordFunction.neighbor += 1;
    else if (functionCandidate === 'approach-candidate') nonChordFunction.approach += 1;
    else nonChordFunction.other += 1;
  });

  return Object.freeze({
    trackId: trackId ?? null,
    noteCount: notes.length,
    key: key ? Object.freeze({ ...key, source: options.keySource === 'selected' ? 'selected' : 'candidate' }) : null,
    scaleBasis: scaleBasis ? Object.freeze({ id: scaleBasis.id, label: scaleBasis.label }) : null,
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
    nonChordFunction: Object.freeze({ ...nonChordFunction }),
    notes: Object.freeze(details.map((detail) => Object.freeze({ ...detail }))),
    note: 'Passing / Neighbor / Approachは前後の動きから見た候補です。Chord Tone・Scale Tone・外音のどれも誤りとは判定しません。',
  });
}

export function parseNoteFunctionKey(value) {
  return parseKeyValue(value);
}
