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
const DEGREE_LABELS = Object.freeze(['I', '♭II', 'II', '♭III', 'III', 'IV', '♭V', 'V', '♭VI', 'VI', '♭VII', 'VII']);

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

function candidateFromSegment(segment) {
  if (!segment) return null;
  const selectedCandidate = segment.selectedCandidate
    ?? (segment.selected ? segment.candidates?.find((candidate) => candidate.value === segment.selected) : null);
  const candidate = segment.effectiveCandidate ?? selectedCandidate ?? segment.candidates?.[0] ?? null;
  if (!candidate || !Number.isInteger(candidate.root)) return null;
  return Object.freeze({
    candidate,
    explicit: segment.selectionSource === 'selected' || Boolean(segment.selected || selectedCandidate),
    segment,
  });
}

function chordContextAtTick(chordSegments, tick) {
  const segment = (chordSegments ?? []).find((entry) => tick >= entry.startTick && tick < entry.endTick);
  return candidateFromSegment(segment);
}

function normalizedChordSegments(chordSegments) {
  return [...(chordSegments ?? [])]
    .filter((entry) => Number.isFinite(entry.startTick) && Number.isFinite(entry.endTick) && entry.endTick > entry.startTick)
    .sort((a, b) => a.startTick - b.startTick || a.endTick - b.endTick);
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

function normalizeSignatures(song) {
  const signatures = [...(song?.timeSignatures ?? [])]
    .filter((entry) => Number.isFinite(entry.tick) && entry.tick >= 0 && entry.numerator > 0 && entry.denominator > 0)
    .sort((a, b) => a.tick - b.tick);
  if (!signatures.length || signatures[0].tick > 0) {
    signatures.unshift({ tick: 0, numerator: 4, denominator: 4, implicit: true });
  }
  return signatures;
}

function timingAtTick(song, tick) {
  const ppq = Number(song?.ppq);
  if (!Number.isFinite(ppq) || ppq <= 0) return null;
  const signatures = normalizeSignatures(song);
  let signature = signatures[0];
  for (const item of signatures) {
    if (item.tick > tick) break;
    signature = item;
  }
  const unitTicks = ppq * 4 / signature.denominator;
  const compound = signature.numerator >= 6 && signature.numerator % 3 === 0;
  const musicalBeatTicks = compound ? unitTicks * 3 : unitTicks;
  const barTicks = unitTicks * signature.numerator;
  const offset = mod(tick - signature.tick, musicalBeatTicks);
  const tolerance = Math.max(1, Math.round(ppq / 48));
  const distanceToBoundary = Math.min(offset, musicalBeatTicks - offset);
  return Object.freeze({
    signature: Object.freeze({ ...signature }),
    musicalBeatTicks,
    barTicks,
    onBeat: distanceToBoundary <= tolerance,
    beatStrength: distanceToBoundary <= tolerance ? 'strong' : 'weak',
  });
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

function directionLabel(interval) {
  if (interval > 0) return 'up';
  if (interval < 0) return 'down';
  return 'same';
}

function relationFrom(scaleTone, chordTone) {
  if (scaleTone === null || chordTone === null) return 'unresolved';
  if (scaleTone && chordTone) return 'both';
  if (scaleTone) return 'scale-only';
  if (chordTone) return 'chord-only';
  return 'outside-both';
}

function nextDetailInRange(details, index, minTick, maxTick) {
  for (let i = index + 1; i < details.length; i += 1) {
    const detail = details[i];
    if (detail.startTick > maxTick) break;
    if (detail.startTick < minTick) continue;
    return detail;
  }
  return null;
}

function analyzeResolution(song, details) {
  const summary = { evaluated: 0, resolved: 0, unresolved: 0, unknown: 0 };
  details.forEach((detail, index) => {
    if (detail.chordTone !== false) return;
    const next = details[index + 1] ?? null;
    if (!next) {
      summary.unknown += 1;
      return;
    }
    const timing = timingAtTick(song, detail.startTick);
    const beatTicks = timing?.musicalBeatTicks ?? Math.max(1, Number(song?.ppq) || 480);
    const deltaTick = next.startTick - detail.startTick;
    if (!(deltaTick > 0) || deltaTick > beatTicks * 2) {
      summary.unknown += 1;
      return;
    }
    if (next.chordTone === null) {
      summary.unknown += 1;
      return;
    }
    summary.evaluated += 1;
    if (next.chordTone !== true) {
      summary.unresolved += 1;
      return;
    }
    const intervalSemitones = next.pitch - detail.pitch;
    detail.resolutionCandidate = {
      targetId: next.id,
      targetPitch: next.pitch,
      targetTick: next.startTick,
      deltaTick,
      deltaBeats: round(deltaTick / beatTicks, 3),
      intervalSemitones,
      direction: directionLabel(intervalSemitones),
      stepwise: isStep(intervalSemitones),
    };
    summary.resolved += 1;
  });
  return summary;
}

function analyzeBeatContext(song, details) {
  const summary = { evaluated: 0, strong: 0, weak: 0, nonChordStrong: 0, nonChordWeak: 0 };
  for (const detail of details) {
    const timing = timingAtTick(song, detail.startTick);
    detail.beatStrength = timing?.beatStrength ?? 'unknown';
    if (!timing) continue;
    summary.evaluated += 1;
    if (timing.beatStrength === 'strong') summary.strong += 1;
    else summary.weak += 1;
    if (detail.chordTone === false) {
      if (timing.beatStrength === 'strong') summary.nonChordStrong += 1;
      else summary.nonChordWeak += 1;
    }
  }
  return summary;
}

function analyzeSuspensions(song, notes, details, chordSegments) {
  const segments = normalizedChordSegments(chordSegments);
  const summary = { evaluated: 0, candidates: 0 };
  if (segments.length < 2) return summary;

  details.forEach((detail, index) => {
    const note = notes[index];
    if (!note) return;
    const noteEnd = note.startTick + note.durationTick;
    for (let segmentIndex = 0; segmentIndex < segments.length - 1; segmentIndex += 1) {
      const left = segments[segmentIndex];
      const right = segments[segmentIndex + 1];
      const boundary = left.endTick;
      if (right.startTick !== boundary) continue;
      if (!(note.startTick < boundary && noteEnd >= boundary)) continue;
      const oldContext = candidateFromSegment(left);
      const newContext = candidateFromSegment(right);
      if (!oldContext || !newContext) continue;
      if (oldContext.candidate.value === newContext.candidate.value) continue;
      const oldTone = isChordTone(note, oldContext);
      const newTone = isChordTone(note, newContext);
      if (oldTone !== true || newTone !== false) continue;
      summary.evaluated += 1;
      const timing = timingAtTick(song, boundary);
      const beatTicks = timing?.musicalBeatTicks ?? Math.max(1, Number(song?.ppq) || 480);
      const next = nextDetailInRange(details, index, boundary, boundary + beatTicks * 2);
      if (!next) continue;
      const targetTone = isChordTone({ pitch: next.pitch }, newContext);
      const intervalSemitones = next.pitch - detail.pitch;
      if (targetTone !== true || !isStep(intervalSemitones)) continue;
      detail.suspensionCandidate = {
        boundaryTick: boundary,
        fromChord: oldContext.candidate.value,
        toChord: newContext.candidate.value,
        targetId: next.id,
        targetPitch: next.pitch,
        targetTick: next.startTick,
        delayTick: next.startTick - boundary,
        delayBeats: round((next.startTick - boundary) / beatTicks, 3),
        intervalSemitones,
        direction: directionLabel(intervalSemitones),
      };
      summary.candidates += 1;
      break;
    }
  });
  return summary;
}

function analyzeAnticipations(song, notes, details, chordSegments) {
  const segments = normalizedChordSegments(chordSegments);
  const summary = { evaluated: 0, candidates: 0 };
  if (segments.length < 2) return summary;

  details.forEach((detail, index) => {
    if (detail.chordTone !== false) return;
    const note = notes[index];
    if (!note) return;
    const segmentIndex = segments.findIndex((segment) => detail.startTick >= segment.startTick && detail.startTick < segment.endTick);
    if (segmentIndex < 0 || segmentIndex >= segments.length - 1) return;
    const currentSegment = segments[segmentIndex];
    const nextSegment = segments[segmentIndex + 1];
    if (nextSegment.startTick !== currentSegment.endTick) return;
    const boundary = currentSegment.endTick;
    const timing = timingAtTick(song, detail.startTick);
    const beatTicks = timing?.musicalBeatTicks ?? Math.max(1, Number(song?.ppq) || 480);
    const leadTick = boundary - detail.startTick;
    if (!(leadTick > 0) || leadTick > beatTicks) return;
    const nextContext = candidateFromSegment(nextSegment);
    if (!nextContext || isChordTone(note, nextContext) !== true) return;
    summary.evaluated += 1;

    const noteEnd = note.startTick + note.durationTick;
    const repeatedAfterBoundary = details.slice(index + 1).find((candidate) => (
      candidate.startTick >= boundary
      && candidate.startTick <= boundary + beatTicks
      && candidate.pitch === detail.pitch
    )) ?? null;
    const holdsAcrossBoundary = noteEnd >= boundary;
    if (!holdsAcrossBoundary && !repeatedAfterBoundary) return;

    detail.anticipationCandidate = {
      boundaryTick: boundary,
      nextChord: nextContext.candidate.value,
      leadTick,
      leadBeats: round(leadTick / beatTicks, 3),
      holdsAcrossBoundary,
      repeatedAfterBoundary: Boolean(repeatedAfterBoundary),
    };
    summary.candidates += 1;
  });
  return summary;
}

function degreeForPitch(pitch, key) {
  if (!key) return null;
  return DEGREE_LABELS[mod(pitchClass(pitch) - key.root, 12)];
}

function analyzePhraseLandings(song, notes, details, key, scaleBasis, chordSegments, sectionBoundaries = []) {
  const landings = [];
  const counts = { chordTone: 0, scaleTone: 0, nonScaleTone: 0 };
  const degreeCounts = new Map();
  const boundaries = [...sectionBoundaries].filter(Number.isFinite).sort((a, b) => a - b);

  details.forEach((detail, index) => {
    const note = notes[index];
    if (!note) return;
    const noteEnd = note.startTick + note.durationTick;
    const next = details[index + 1] ?? null;
    const timing = timingAtTick(song, noteEnd);
    const beatTicks = timing?.musicalBeatTicks ?? Math.max(1, Number(song?.ppq) || 480);
    const gapTick = next ? Math.max(0, next.startTick - noteEnd) : Math.max(0, Number(song?.lengthTicks ?? noteEnd) - noteEnd);
    const sectionBoundary = boundaries.find((boundary) => boundary >= noteEnd && (!next || boundary <= next.startTick)) ?? null;
    const isLast = !next;
    const hasPhraseGap = gapTick >= beatTicks;
    if (!isLast && !hasPhraseGap && sectionBoundary === null) return;

    const landingTick = Math.max(note.startTick, noteEnd - 1);
    const chordContext = chordContextAtTick(chordSegments, landingTick);
    const chordTone = isChordTone(note, chordContext);
    const scaleTone = isScaleTone(note, key, scaleBasis);
    const degree = degreeForPitch(note.pitch, key);
    const relation = relationFrom(scaleTone, chordTone);
    const reason = sectionBoundary !== null ? 'section-boundary' : (isLast ? 'last-note' : 'phrase-gap');

    if (chordTone === true) counts.chordTone += 1;
    if (scaleTone === true) counts.scaleTone += 1;
    if (scaleTone === false) counts.nonScaleTone += 1;
    if (degree) degreeCounts.set(degree, (degreeCounts.get(degree) ?? 0) + 1);

    landings.push({
      id: detail.id,
      pitch: detail.pitch,
      startTick: detail.startTick,
      endTick: noteEnd,
      gapTick,
      gapBeats: round(gapTick / beatTicks, 3),
      reason,
      chord: chordContext?.candidate?.value ?? null,
      chordTone,
      scaleTone,
      relation,
      degree,
    });
  });

  const topDegrees = [...degreeCounts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    .slice(0, 3);

  return {
    count: landings.length,
    chordTone: counts.chordTone,
    scaleTone: counts.scaleTone,
    nonScaleTone: counts.nonScaleTone,
    topDegrees,
    landings,
  };
}

function freezeDetail(detail) {
  const nestedKeys = ['resolutionCandidate', 'suspensionCandidate', 'anticipationCandidate'];
  for (const key of nestedKeys) {
    if (detail[key]) detail[key] = Object.freeze({ ...detail[key] });
  }
  return Object.freeze({ ...detail });
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
      beatStrength: 'unknown',
      resolutionCandidate: null,
      suspensionCandidate: null,
      anticipationCandidate: null,
    };
  });

  const nonChordFunction = { evaluated: 0, passing: 0, neighbor: 0, approach: 0, other: 0 };

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

  const beatContext = analyzeBeatContext(song, details);
  const resolution = analyzeResolution(song, details);
  const suspension = analyzeSuspensions(song, notes, details, options.chordSegments);
  const anticipation = analyzeAnticipations(song, notes, details, options.chordSegments);
  const phraseLanding = analyzePhraseLandings(song, notes, details, key, scaleBasis, options.chordSegments, options.sectionBoundaries ?? []);

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
    beatContext: Object.freeze({ ...beatContext }),
    resolution: Object.freeze({ ...resolution, ratio: round(resolution.evaluated ? resolution.resolved / resolution.evaluated : 0) }),
    suspension: Object.freeze({ ...suspension }),
    anticipation: Object.freeze({ ...anticipation }),
    phraseLanding: Object.freeze({
      ...phraseLanding,
      topDegrees: Object.freeze(phraseLanding.topDegrees.map((item) => Object.freeze({ ...item }))),
      landings: Object.freeze(phraseLanding.landings.map((item) => Object.freeze({ ...item }))),
    }),
    notes: Object.freeze(details.map(freezeDetail)),
    note: 'Passing / Neighbor / Approach / Resolution / Suspension / Anticipationは時間・拍・Chord文脈から見た候補です。Chord Tone・Scale Tone・外音のどれも誤りとは判定しません。',
  });
}

export function parseNoteFunctionKey(value) {
  return parseKeyValue(value);
}
