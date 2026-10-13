import { analyzeChords, getDefaultChordTrackIds } from '../chord/index.js';

const PITCH_NAMES = Object.freeze(['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']);
const QUALITY_INTERVALS = Object.freeze({
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

function activeNotes(song, trackIds, startTick, endTick) {
  const selected = new Set(trackIds ?? []);
  return (song?.notes ?? []).filter((note) => note.channel !== 9
    && selected.has(note.trackId)
    && note.durationTick > 0
    && note.startTick < endTick
    && note.startTick + note.durationTick > startTick);
}

function noteWeights(notes, startTick, endTick) {
  const weights = Array(12).fill(0);
  let lowest = null;
  for (const note of notes) {
    const overlap = Math.min(endTick, note.startTick + note.durationTick) - Math.max(startTick, note.startTick);
    if (overlap <= 0) continue;
    const pc = mod(note.pitch, 12);
    weights[pc] += overlap * note.velocity;
    if (!lowest || note.pitch < lowest.pitch || (note.pitch === lowest.pitch && note.velocity > lowest.velocity)) lowest = note;
  }
  return { weights, lowest };
}

function extensionCandidates(candidate, weights) {
  const root = candidate.root;
  const chordIntervals = new Set(QUALITY_INTERVALS[candidate.quality] ?? [0]);
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (!total) return [];

  const labels = new Map([
    [2, 'add9'],
    [5, '11'],
    [9, '6/13'],
  ]);
  const result = [];
  for (const [interval, label] of labels) {
    if (chordIntervals.has(interval)) continue;
    const pc = mod(root + interval, 12);
    const ratio = weights[pc] / total;
    if (ratio >= 0.08) result.push(Object.freeze({ label, pitchClass: pc, ratio: Number(ratio.toFixed(4)) }));
  }
  return result;
}

function inversionLabel(candidate, lowest) {
  if (!lowest) return null;
  const bassPc = mod(lowest.pitch, 12);
  if (bassPc === candidate.root) return null;
  const allowed = QUALITY_INTERVALS[candidate.quality] ?? [0];
  const relative = mod(bassPc - candidate.root, 12);
  if (!allowed.includes(relative)) return null;
  return Object.freeze({ pitchClass: bassPc, name: PITCH_NAMES[bassPc] });
}

export function analyzeHarmonyDetails(song, options = {}) {
  const trackIds = options.trackIds ?? getDefaultChordTrackIds(song);
  const chordResult = options.chordResult ?? analyzeChords(song, { trackIds });
  const segments = chordResult.segments.map((segment) => {
    const candidate = segment.candidates[0] ?? null;
    if (!candidate) return Object.freeze({ ...segment, detail: null });
    const notes = activeNotes(song, trackIds, segment.startTick, segment.endTick);
    const { weights, lowest } = noteWeights(notes, segment.startTick, segment.endTick);
    const inversion = inversionLabel(candidate, lowest);
    const extensions = extensionCandidates(candidate, weights);
    const displayValue = inversion ? `${candidate.value}/${inversion.name}` : candidate.value;
    return Object.freeze({
      id: segment.id,
      startTick: segment.startTick,
      endTick: segment.endTick,
      barNumber: segment.barNumber,
      baseCandidate: candidate,
      displayValue,
      inversion,
      extensions: Object.freeze(extensions),
    });
  });

  return Object.freeze({
    trackIds: Object.freeze([...trackIds]),
    segments: Object.freeze(segments),
    note: 'v0.2では既存Chord候補の上に、最低音から転回形/Slash Chord候補とadd9・11・6/13の色付け候補を重ねます。',
  });
}
