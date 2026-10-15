import { formatMidiPitch, getDefaultMelodyTrackId } from '../basic/index.js';
import { analyzeChords } from '../chord/index.js';
import { analyzeKeyScale } from '../key/index.js';
import { analyzeNoteFunctions } from '../note-function/index.js';
import { analyzeStructure } from '../structure/index.js';

const PITCH_NAMES = Object.freeze(['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']);
const DEGREE_LABELS = Object.freeze(['I', '♭II', 'II', '♭III', 'III', 'IV', '♭V', 'V', '♭VI', 'VI', '♭VII', 'VII']);

function mod(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function round(value, digits = 3) {
  if (!Number.isFinite(value)) return null;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function average(values) {
  const valid = values.filter(Number.isFinite);
  if (!valid.length) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function representativeMelodyNotes(song, trackId) {
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

function shapeFromNotes(notes) {
  if (notes.length < 2) return 'insufficient';
  const count = notes.length;
  const quarter = Math.max(1, Math.floor(count / 4));
  const start = average(notes.slice(0, quarter).map((note) => note.pitch));
  const middleStart = Math.floor(count * 0.35);
  const middleEnd = Math.max(middleStart + 1, Math.ceil(count * 0.65));
  const middle = average(notes.slice(middleStart, middleEnd).map((note) => note.pitch));
  const end = average(notes.slice(-quarter).map((note) => note.pitch));
  if (![start, middle, end].every(Number.isFinite)) return 'insufficient';
  if (middle >= start + 2 && middle >= end + 2) return 'arch';
  if (middle <= start - 2 && middle <= end - 2) return 'valley';
  if (end >= start + 3) return 'ascending';
  if (end <= start - 3) return 'descending';
  return 'mixed';
}

function countDirectionChanges(notes) {
  const signs = [];
  for (let index = 1; index < notes.length; index += 1) {
    const interval = notes[index].pitch - notes[index - 1].pitch;
    if (interval !== 0) signs.push(Math.sign(interval));
  }
  let changes = 0;
  for (let index = 1; index < signs.length; index += 1) {
    if (signs[index] !== signs[index - 1]) changes += 1;
  }
  return changes;
}

function noteLocalDensity(notes, note, ppq) {
  const radius = Math.max(1, ppq * 2);
  return notes.filter((candidate) => Math.abs(candidate.startTick - note.startTick) <= radius).length;
}

function analyzePhraseContour(song, options = {}) {
  const trackId = options.trackId ?? getDefaultMelodyTrackId(song);
  const notes = representativeMelodyNotes(song, trackId);
  if (!notes.length) {
    return Object.freeze({
      trackId: trackId ?? null,
      noteCount: 0,
      shape: 'insufficient',
      rangeSemitones: null,
      peak: null,
      lowest: null,
      climaxCandidate: null,
      directionChanges: 0,
      note: 'Melody NoteがないためPhrase contourを算出できません。',
    });
  }

  const ppq = Number(song?.ppq) || 480;
  const pitches = notes.map((note) => note.pitch);
  const minPitch = Math.min(...pitches);
  const maxPitch = Math.max(...pitches);
  const range = Math.max(0, maxPitch - minPitch);
  const maxLocalDensity = Math.max(...notes.map((note) => noteLocalDensity(notes, note, ppq)), 1);
  const songLength = Math.max(Number(song?.lengthTicks) || notes.at(-1).startTick + notes.at(-1).durationTick, 1);

  const scored = notes.map((note) => {
    const pitchScore = range ? (note.pitch - minPitch) / range : 0.5;
    const velocityScore = Math.max(0, Math.min(1, Number(note.velocity) / 127));
    const densityScore = noteLocalDensity(notes, note, ppq) / maxLocalDensity;
    return {
      note,
      score: 0.55 * pitchScore + 0.25 * velocityScore + 0.20 * densityScore,
    };
  }).sort((a, b) => b.score - a.score || b.note.pitch - a.note.pitch || a.note.startTick - b.note.startTick);

  const peakNote = [...notes]
    .sort((a, b) => b.pitch - a.pitch || b.velocity - a.velocity || a.startTick - b.startTick)[0];
  const lowestNote = [...notes]
    .sort((a, b) => a.pitch - b.pitch || b.velocity - a.velocity || a.startTick - b.startTick)[0];
  const climax = scored[0];

  const toEvidence = (note) => Object.freeze({
    id: note.id ?? null,
    pitch: note.pitch,
    pitchName: formatMidiPitch(note.pitch),
    tick: note.startTick,
    positionRatio: round(note.startTick / songLength, 4),
    velocity: note.velocity,
  });

  return Object.freeze({
    trackId,
    noteCount: notes.length,
    shape: shapeFromNotes(notes),
    rangeSemitones: range,
    directionChanges: countDirectionChanges(notes),
    startPitch: notes[0].pitch,
    endPitch: notes.at(-1).pitch,
    peak: toEvidence(peakNote),
    lowest: toEvidence(lowestNote),
    climaxCandidate: Object.freeze({
      ...toEvidence(climax.note),
      score: round(climax.score, 4),
      evidence: Object.freeze({
        pitchContribution: round(range ? (climax.note.pitch - minPitch) / range : 0.5, 4),
        velocityContribution: round(Math.max(0, Math.min(1, Number(climax.note.velocity) / 127)), 4),
        localDensityContribution: round(noteLocalDensity(notes, climax.note, ppq) / maxLocalDensity, 4),
      }),
    }),
    note: 'Climaxは最高音・Velocity・周辺発音密度を合わせた候補であり、聴感上の正解や曲の良し悪しを判定しません。',
  });
}

function parseKeyRoot(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(.+?)\s+(major|minor)$/);
  if (!match) return null;
  const root = PITCH_NAMES.indexOf(match[1]);
  return root >= 0 ? root : null;
}

function degreeForPitch(pitch, keyValue) {
  const root = parseKeyRoot(keyValue);
  if (!Number.isInteger(root)) return null;
  return DEGREE_LABELS[mod(pitch - root, 12)];
}

function effectiveChordSegments(chords) {
  return (chords?.segments ?? []).map((segment) => Object.freeze({
    ...segment,
    effectiveCandidate: segment.effectiveCandidate ?? segment.selectedCandidate ?? segment.candidates?.[0] ?? null,
  }));
}

function mostCommon(values) {
  const counts = new Map();
  for (const value of values.filter(Boolean)) counts.set(value, (counts.get(value) ?? 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
  return sorted[0] ? Object.freeze({ value: sorted[0][0], count: sorted[0][1] }) : null;
}

function buildSectionLandingComparison(song, options = {}) {
  const structure = options.structure ?? analyzeStructure(song);
  const keyValue = options.keyValue ?? analyzeKeyScale(song).candidates?.[0]?.value ?? null;
  const chordSegments = options.chordSegments ?? effectiveChordSegments(analyzeChords(song));
  const trackId = options.trackId ?? getDefaultMelodyTrackId(song);
  const sectionBoundaries = (structure?.sections ?? []).slice(0, -1).map((section) => section.endTick);
  const noteFunction = analyzeNoteFunctions(song, {
    trackId,
    keyValue,
    keySource: 'candidate',
    chordSegments,
    sectionBoundaries,
  });

  const details = noteFunction.notes ?? [];
  const entries = (structure?.sections ?? []).map((section) => {
    const candidates = details.filter((detail) => detail.startTick >= section.startTick && detail.startTick < section.endTick);
    const landing = candidates.at(-1) ?? null;
    return Object.freeze({
      sectionId: section.id,
      label: section.label,
      startBar: section.startBar,
      endBar: section.endBar,
      pitch: landing?.pitch ?? null,
      pitchName: landing ? formatMidiPitch(landing.pitch) : null,
      degree: landing ? degreeForPitch(landing.pitch, keyValue) : null,
      relation: landing?.relation ?? 'unknown',
      chord: landing?.chord ?? null,
      chordTone: landing?.chordTone ?? null,
      scaleTone: landing?.scaleTone ?? null,
      beatStrength: landing?.beatStrength ?? 'unknown',
    });
  });

  const valid = entries.filter((entry) => Number.isFinite(entry.pitch));
  const commonDegree = mostCommon(valid.map((entry) => entry.degree));
  const commonRelation = mostCommon(valid.map((entry) => entry.relation));
  const degreeVariety = new Set(valid.map((entry) => entry.degree).filter(Boolean)).size;
  const summary = valid.length
    ? (commonDegree && commonDegree.count >= 2
      ? `Section着地では ${commonDegree.value} が ${commonDegree.count}/${valid.length} 回で最頻です。`
      : `Sectionごとの着地Degreeは ${degreeVariety} 種類あり、着地点が分散しています。`)
    : 'Section着地を比較できるMelody Noteがありません。';

  return Object.freeze({
    keyValue,
    trackId,
    entries: Object.freeze(entries),
    commonDegree,
    commonRelation,
    degreeVariety,
    summary,
    note: 'Section候補ごとの最後の代表Melody Noteを比較します。Section名や着地の役割をVerse/Chorusとして自動確定しません。',
  });
}

function sectionDensityContrast(structure) {
  const densities = (structure?.sections ?? []).map((section) => section.metrics?.density).filter(Number.isFinite);
  if (densities.length < 2) return null;
  const min = Math.min(...densities);
  const max = Math.max(...densities);
  return Object.freeze({ min, max, delta: round(max - min, 3), ratio: max > 0 ? round((max - min) / max, 4) : 0 });
}

function buildTopCharacteristics({ contour, landingComparison, noteFunction, structure }) {
  const candidates = [];
  if (contour?.peak) {
    const position = Math.round((contour.peak.positionRatio ?? 0) * 100);
    candidates.push({
      id: 'melody-peak',
      weight: 0.9,
      title: `最高音 ${contour.peak.pitchName}`,
      evidence: `全体の約${position}%地点 · Melody音域 ${contour.rangeSemitones ?? '—'} semitone`,
      meaning: 'Melodyの最高音位置と音域の広がりを示す観測値です。',
    });
  }
  if (contour?.shape && contour.shape !== 'insufficient') {
    candidates.push({
      id: 'phrase-contour',
      weight: 0.78 + Math.min(0.12, (contour.directionChanges ?? 0) * 0.01),
      title: `Phrase contour: ${contour.shape}`,
      evidence: `方向転換 ${contour.directionChanges}回 · 開始 ${formatMidiPitch(contour.startPitch)} → 終了 ${formatMidiPitch(contour.endPitch)}`,
      meaning: 'フレーズ全体のPitch輪郭を要約しています。',
    });
  }
  if (landingComparison?.entries?.length) {
    const common = landingComparison.commonDegree;
    candidates.push({
      id: 'section-landing',
      weight: common ? 0.86 : 0.72,
      title: common ? `Section着地は ${common.value} が最頻` : 'Section着地が分散',
      evidence: landingComparison.summary,
      meaning: 'Section終端のMelodyがどのDegreeへ着地するかを比較した結果です。',
    });
  }
  if (noteFunction?.resolution?.evaluated > 0) {
    candidates.push({
      id: 'resolution',
      weight: 0.74 + Math.abs((noteFunction.resolution.ratio ?? 0) - 0.5) * 0.2,
      title: `外音の解決候補 ${Math.round((noteFunction.resolution.ratio ?? 0) * 100)}%`,
      evidence: `${noteFunction.resolution.resolved}/${noteFunction.resolution.evaluated}件が2 musicalBeat以内のChord Toneへ移動`,
      meaning: 'Non-Chord Toneが近い時間内にChord Toneへ移る傾向を示します。',
    });
  }
  const densityContrast = sectionDensityContrast(structure);
  if (densityContrast) {
    candidates.push({
      id: 'section-density',
      weight: 0.68 + Math.min(0.2, densityContrast.ratio ?? 0),
      title: `Section密度差 ${densityContrast.delta}`,
      evidence: `最小 ${densityContrast.min} / quarter → 最大 ${densityContrast.max} / quarter`,
      meaning: 'Section間でNote密度がどれくらい変わるかを示します。',
    });
  }
  if ((structure?.modulations?.length ?? 0) > 0) {
    candidates.push({
      id: 'modulation',
      weight: 0.8,
      title: `転調候補 ${structure.modulations.length}箇所`,
      evidence: structure.modulations.slice(0, 3).map((item) => `${item.from}→${item.to}`).join(' / '),
      meaning: '区間Key候補が切り替わる場所を特徴として要約しています。',
    });
  }
  if (noteFunction?.chordTone?.evaluated > 0) {
    candidates.push({
      id: 'chord-tone-ratio',
      weight: 0.64 + Math.abs((noteFunction.chordTone.ratio ?? 0) - 0.5) * 0.18,
      title: `Chord Tone率 ${Math.round((noteFunction.chordTone.ratio ?? 0) * 100)}%`,
      evidence: `${noteFunction.chordTone.tone}/${noteFunction.chordTone.evaluated} notes`,
      meaning: 'Melodyの代表NoteがChord Toneに含まれる割合です。正誤判定ではありません。',
    });
  }

  return Object.freeze(candidates
    .sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id))
    .slice(0, 5)
    .map(({ weight, ...item }) => Object.freeze(item)));
}

export function analyzeSongInsights(song, options = {}) {
  const structure = options.structure ?? analyzeStructure(song);
  const keyValue = options.keyValue ?? analyzeKeyScale(song).candidates?.[0]?.value ?? null;
  const chordSegments = options.chordSegments ?? effectiveChordSegments(analyzeChords(song));
  const trackId = options.trackId ?? getDefaultMelodyTrackId(song);
  const contour = analyzePhraseContour(song, { trackId });
  const landingComparison = buildSectionLandingComparison(song, { structure, keyValue, chordSegments, trackId });
  const noteFunction = analyzeNoteFunctions(song, {
    trackId,
    keyValue,
    keySource: 'candidate',
    chordSegments,
    sectionBoundaries: (structure?.sections ?? []).slice(0, -1).map((section) => section.endTick),
  });
  const topCharacteristics = buildTopCharacteristics({ contour, landingComparison, noteFunction, structure });

  return Object.freeze({
    trackId,
    keyValue,
    contour,
    landingComparison,
    topCharacteristics,
    note: 'Insightは既存AnalyzerのEvidenceをまとめた観測候補です。品質・人気・正解を採点せず、元MIDIやSongProjectを変更しません。',
  });
}
