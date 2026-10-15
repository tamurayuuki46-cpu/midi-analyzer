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

function formatNumber(value, suffix = '') {
  return Number.isFinite(value) ? `${round(value, 2)}${suffix}` : '—';
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${Math.round(value * 100)}%` : '—';
}

function buildMetricInsight({ id, title, metric, suffix = '', percent = false, scale = 1, higher, lower }) {
  if (!Number.isFinite(metric?.reference) || !Number.isFinite(metric?.own) || !Number.isFinite(metric?.delta)) return null;
  const formatter = percent ? formatPercent : (value) => formatNumber(value, suffix);
  const absDelta = Math.abs(metric.delta);
  const base = Math.max(Math.abs(metric.reference), Math.abs(metric.own), scale, 1e-9);
  let meaning = '参考曲と自作曲はこの指標でほぼ同じです。';
  if (metric.delta > 0) meaning = higher;
  else if (metric.delta < 0) meaning = lower;
  return Object.freeze({
    id,
    title,
    weight: round(absDelta / base, 4) ?? 0,
    reference: metric.reference,
    own: metric.own,
    delta: metric.delta,
    evidence: `参考 ${formatter(metric.reference)} / 自作 ${formatter(metric.own)}`,
    meaning,
  });
}

function buildDifferenceInsights(reference, own, metrics, sameTopKey, similarity) {
  const candidates = [
    buildMetricInsight({ id: 'melody-range', title: 'Melody音域', metric: metrics.melodyRange, suffix: ' st', scale: 12, higher: '自作曲のMelody音域が参考曲より広いです。', lower: '自作曲のMelody音域が参考曲より狭いです。' }),
    buildMetricInsight({ id: 'melody-density', title: 'Melody密度', metric: metrics.melodyDensity, scale: 1, higher: '自作曲のMelody発音密度が参考曲より高いです。', lower: '自作曲のMelody発音密度が参考曲より低いです。' }),
    buildMetricInsight({ id: 'melody-leap', title: 'Melody平均跳躍', metric: metrics.melodyAverageLeap, suffix: ' st', scale: 4, higher: '自作曲は参考曲より大きい跳躍を使う傾向です。', lower: '自作曲は参考曲より順次的な動きが多い傾向です。' }),
    buildMetricInsight({ id: 'bass-movement', title: 'Bass移動量', metric: metrics.bassAverageMovement, suffix: ' st', scale: 4, higher: '自作曲のBassは参考曲よりPitch移動が大きいです。', lower: '自作曲のBassは参考曲よりPitch移動が小さいです。' }),
    buildMetricInsight({ id: 'bass-root', title: 'Bass Root率', metric: metrics.bassRootRatio, percent: true, scale: 0.25, higher: '自作曲は参考曲よりBassがChord Rootにいる割合が高いです。', lower: '自作曲は参考曲よりBassがChord Root以外を使う割合が高いです。' }),
    buildMetricInsight({ id: 'rhythm-density', title: 'Rhythm密度', metric: metrics.rhythmOnsetsPerQuarter, scale: 1, higher: '自作曲のRhythm onset密度が参考曲より高いです。', lower: '自作曲のRhythm onset密度が参考曲より低いです。' }),
    buildMetricInsight({ id: 'on-beat', title: '拍頭率', metric: metrics.rhythmOnBeatRatio, percent: true, scale: 0.25, higher: '自作曲は参考曲より拍頭に発音が集まる傾向です。', lower: '自作曲は参考曲より拍の途中に発音が置かれる傾向です。' }),
    buildMetricInsight({ id: 'note-density', title: '全体Note密度', metric: metrics.noteDensity, scale: 1, higher: '自作曲の全体Note密度が参考曲より高いです。', lower: '自作曲の全体Note密度が参考曲より低いです。' }),
    buildMetricInsight({ id: 'modulation', title: '転調候補数', metric: metrics.modulationCount, scale: 1, higher: '自作曲は参考曲より区間Key切替候補が多いです。', lower: '自作曲は参考曲より区間Key切替候補が少ないです。' }),
  ].filter(Boolean);

  if (reference.key && own.key) {
    candidates.push(Object.freeze({
      id: 'key',
      title: 'Top Key候補',
      weight: sameTopKey ? 0 : 1,
      reference: reference.key,
      own: own.key,
      delta: null,
      evidence: `参考 ${reference.key} / 自作 ${own.key}`,
      meaning: sameTopKey ? 'Top Key候補は同じです。' : 'Top Key候補が異なります。移調差だけでなくScale構成の違いも確認できます。',
    }));
  }

  if (Number.isFinite(similarity)) {
    candidates.push(Object.freeze({
      id: 'chord-similarity',
      title: 'Chord集合の共通度',
      weight: round(1 - similarity, 4) ?? 0,
      reference: null,
      own: null,
      delta: null,
      evidence: `共通度 ${formatPercent(similarity)}`,
      meaning: similarity >= 0.75 ? '使われるChord集合はかなり共通しています。' : similarity >= 0.4 ? '共通Chordと異なるChordが混在しています。' : '使われるChord集合の違いが大きいです。',
    }));
  }

  return Object.freeze(candidates
    .sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id))
    .slice(0, 5)
    .map(({ weight, ...item }) => Object.freeze(item)));
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
  const sameTopKey = Boolean(reference.key && own.key && reference.key === own.key);
  const similarity = chordSimilarity(reference.uniqueChords, own.uniqueChords);
  const differenceInsights = buildDifferenceInsights(reference, own, metrics, sameTopKey, similarity);

  return Object.freeze({
    reference,
    own,
    metrics,
    sameTopKey,
    chordSimilarity: similarity,
    differenceInsights,
    note: '比較値と差分説明は作曲判断の補助です。似ている/違うを優劣として評価しません。',
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
