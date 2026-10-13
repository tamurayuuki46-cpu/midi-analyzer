import { analyzeBass, analyzeMelody, analyzeRhythm, getDefaultBassTrackId, getDefaultMelodyTrackId, getDefaultRhythmTrackIds } from '../basic/index.js';
import { analyzeChords } from '../chord/index.js';
import { buildTopChordProgression } from '../chord/topProgression.js';
import { analyzeKeyScale } from '../key/index.js';
import { analyzeStructure } from '../structure/index.js';

function round(value, digits = 2) {
  if (!Number.isFinite(value)) return null;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function quarterLength(song) {
  const ppq = Number(song?.ppq);
  const lengthTicks = Number(song?.lengthTicks);
  if (!Number.isFinite(ppq) || ppq <= 0 || !Number.isFinite(lengthTicks) || lengthTicks <= 0) return 0;
  return lengthTicks / ppq;
}

function totalDensity(song) {
  const quarters = quarterLength(song);
  if (!quarters) return 0;
  const noteCount = (song?.notes ?? []).filter((note) => note.durationTick > 0).length;
  return noteCount / quarters;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function chordSimilarity(leftValues, rightValues) {
  const left = new Set(leftValues);
  const right = new Set(rightValues);
  const union = new Set([...left, ...right]);
  if (!union.size) return null;
  let common = 0;
  for (const value of left) if (right.has(value)) common += 1;
  return round(common / union.size, 3);
}

export function summarizeSongForCompare(song) {
  const key = analyzeKeyScale(song);
  const chords = analyzeChords(song);
  const progression = buildTopChordProgression(chords.segments);
  const melodyTrackId = getDefaultMelodyTrackId(song);
  const bassTrackId = getDefaultBassTrackId(song);
  const rhythmTrackIds = getDefaultRhythmTrackIds(song);
  const melody = analyzeMelody(song, { trackId: melodyTrackId, chordSegments: chords.segments });
  const bass = analyzeBass(song, { trackId: bassTrackId, chordSegments: chords.segments });
  const rhythm = analyzeRhythm(song, { trackIds: rhythmTrackIds });
  const structure = analyzeStructure(song);
  const firstTempo = song?.tempoMap?.[0]?.bpm ?? null;

  return Object.freeze({
    name: song?.source?.fileName ?? 'untitled.mid',
    key: key.candidates[0]?.value ?? null,
    keyConfidence: key.candidates[0]?.confidence ?? null,
    bpm: Number.isFinite(firstTempo) ? round(firstTempo, 1) : null,
    melodyRange: melody?.range?.semitones ?? null,
    melodyDensity: melody?.density?.notesPerQuarter ?? null,
    melodyAverageLeap: melody?.leap?.averageSemitones ?? null,
    bassAverageMovement: bass?.movement?.averageSemitones ?? null,
    bassRootRatio: bass?.chordRole?.evaluated ? bass.chordRole.rootRatio : null,
    rhythmOnsetsPerQuarter: rhythm?.density?.onsetsPerQuarter ?? null,
    rhythmOnBeatRatio: rhythm?.beatPosition?.onBeatRatio ?? null,
    syncopationCandidates: rhythm?.beatPosition?.syncopationCandidateCount ?? 0,
    noteDensity: round(totalDensity(song), 3),
    modulationCount: structure?.modulations?.length ?? 0,
    sectionCount: structure?.sections?.length ?? 0,
    chordProgression: Object.freeze(progression.map((item) => item.value)),
    uniqueChords: Object.freeze(unique(progression.map((item) => item.value))),
  });
}

function delta(left, right) {
  if (!Number.isFinite(left) || !Number.isFinite(right)) return null;
  return round(left - right, 3);
}

export function compareSongs(referenceSong, ownSong) {
  const reference = summarizeSongForCompare(referenceSong);
  const own = summarizeSongForCompare(ownSong);
  const metrics = Object.freeze({
    melodyRange: Object.freeze({ reference: reference.melodyRange, own: own.melodyRange, delta: delta(own.melodyRange, reference.melodyRange) }),
    melodyDensity: Object.freeze({ reference: reference.melodyDensity, own: own.melodyDensity, delta: delta(own.melodyDensity, reference.melodyDensity) }),
    melodyAverageLeap: Object.freeze({ reference: reference.melodyAverageLeap, own: own.melodyAverageLeap, delta: delta(own.melodyAverageLeap, reference.melodyAverageLeap) }),
    bassAverageMovement: Object.freeze({ reference: reference.bassAverageMovement, own: own.bassAverageMovement, delta: delta(own.bassAverageMovement, reference.bassAverageMovement) }),
    bassRootRatio: Object.freeze({ reference: reference.bassRootRatio, own: own.bassRootRatio, delta: delta(own.bassRootRatio, reference.bassRootRatio) }),
    rhythmOnsetsPerQuarter: Object.freeze({ reference: reference.rhythmOnsetsPerQuarter, own: own.rhythmOnsetsPerQuarter, delta: delta(own.rhythmOnsetsPerQuarter, reference.rhythmOnsetsPerQuarter) }),
    rhythmOnBeatRatio: Object.freeze({ reference: reference.rhythmOnBeatRatio, own: own.rhythmOnBeatRatio, delta: delta(own.rhythmOnBeatRatio, reference.rhythmOnBeatRatio) }),
    noteDensity: Object.freeze({ reference: reference.noteDensity, own: own.noteDensity, delta: delta(own.noteDensity, reference.noteDensity) }),
    modulationCount: Object.freeze({ reference: reference.modulationCount, own: own.modulationCount, delta: own.modulationCount - reference.modulationCount }),
  });

  return Object.freeze({
    reference,
    own,
    metrics,
    sameTopKey: Boolean(reference.key && own.key && reference.key === own.key),
    chordSimilarity: chordSimilarity(reference.uniqueChords, own.uniqueChords),
    note: '比較値は作曲判断の補助です。似ている/違うを優劣として評価しません。',
  });
}

function average(values) {
  const valid = values.filter(Number.isFinite);
  if (!valid.length) return null;
  return round(valid.reduce((sum, value) => sum + value, 0) / valid.length, 3);
}

function mostCommon(values) {
  const counts = new Map();
  for (const value of values.filter(Boolean)) counts.set(value, (counts.get(value) ?? 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
  return sorted[0] ? Object.freeze({ value: sorted[0][0], count: sorted[0][1] }) : null;
}

export function analyzePersonalTrend(songs = []) {
  const summaries = (songs ?? []).filter(Boolean).map(summarizeSongForCompare);
  if (!summaries.length) {
    return Object.freeze({ count: 0, summaries: Object.freeze([]), trend: null, note: '保存済みMIDIがないため作曲傾向を集計できません。' });
  }

  const trend = Object.freeze({
    commonKey: mostCommon(summaries.map((item) => item.key)),
    averageBpm: average(summaries.map((item) => item.bpm)),
    averageMelodyRange: average(summaries.map((item) => item.melodyRange)),
    averageMelodyDensity: average(summaries.map((item) => item.melodyDensity)),
    averageBassMovement: average(summaries.map((item) => item.bassAverageMovement)),
    averageRhythmDensity: average(summaries.map((item) => item.rhythmOnsetsPerQuarter)),
    averageNoteDensity: average(summaries.map((item) => item.noteDensity)),
    averageModulations: average(summaries.map((item) => item.modulationCount)),
    commonChord: mostCommon(summaries.flatMap((item) => item.uniqueChords)),
  });

  return Object.freeze({
    count: summaries.length,
    summaries: Object.freeze(summaries),
    trend,
    note: `${summaries.length}曲の保存済みMIDIから平均・頻出傾向を集計しました。`,
  });
}
