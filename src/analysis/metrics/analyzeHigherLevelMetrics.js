import { degreeForPitchClass } from '../chord/index.js';
import { buildAnalysisBundle } from '../summary/index.js';

const FLOATING_QUALITIES = new Set(['maj7', 'm7', 'sus2', 'sus4', 'aug', 'm7b5']);
const MODULATION_IMPACT = Object.freeze({
  parallel: 0.25,
  relative: 0.2,
  dominant: 0.35,
  subdominant: 0.35,
  'whole-tone': 0.65,
  semitone: 0.8,
  other: 0.9,
});

function clamp01(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function score100(value) {
  return Math.round(clamp01(value) * 100);
}

function ratio(count, total) {
  return total > 0 ? clamp01(count / total) : 0;
}

function normalized(value, min, max) {
  if (!Number.isFinite(value)) return 0;
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return 0.5;
  return clamp01((value - min) / (max - min));
}

function range(values) {
  return values.length ? { min: Math.min(...values), max: Math.max(...values) } : { min: 0, max: 0 };
}

function effectiveChords(bundle) {
  return (bundle?.chords?.segments ?? [])
    .map((segment) => segment.effectiveCandidate ?? segment.candidates?.[0] ?? null)
    .filter(Boolean);
}

function floatingMetric(bundle) {
  const chords = effectiveChords(bundle);
  const colorRatio = ratio(chords.filter((chord) => FLOATING_QUALITIES.has(chord.quality)).length, chords.length);
  const chordToneRatio = bundle?.melody?.chordTone?.evaluated ? Number(bundle.melody.chordTone.ratio) : 1;
  const nonChordRatio = clamp01(1 - (Number.isFinite(chordToneRatio) ? chordToneRatio : 1));
  const modulationRatio = clamp01((bundle?.structure?.modulations?.length ?? 0) / 3);
  const leap = Number(bundle?.melody?.leap?.averageSemitones);
  const smoothMotion = Number.isFinite(leap) ? clamp01(1 - Math.max(0, leap - 2) / 10) : 0;
  const score = score100(0.45 * colorRatio + 0.25 * nonChordRatio + 0.2 * modulationRatio + 0.1 * smoothMotion);
  return Object.freeze({
    id: 'floating',
    label: '浮遊感候補',
    score,
    summary: score >= 67 ? '調性感を少し曖昧に感じさせる材料が多めです。' : score >= 34 ? '安定感と浮遊感の材料が混在しています。' : '比較的、調中心を感じやすい材料が中心です。',
    evidence: Object.freeze([
      `色付きChord候補 ${Math.round(colorRatio * 100)}%`,
      `Melody非Chord Tone候補 ${Math.round(nonChordRatio * 100)}%`,
      `転調候補 ${bundle?.structure?.modulations?.length ?? 0}件`,
      `Melody平均跳躍 ${Number.isFinite(leap) ? leap : '—'} semitone`,
    ]),
  });
}

function chorusMetric(bundle) {
  const sections = bundle?.structure?.sections ?? [];
  const densities = sections.map((item) => Number(item.metrics?.density)).filter(Number.isFinite);
  const velocities = sections.map((item) => Number(item.metrics?.averageVelocity)).filter(Number.isFinite);
  const registers = sections.map((item) => Number(item.metrics?.averagePitch)).filter(Number.isFinite);
  const densityRange = range(densities);
  const velocityRange = range(velocities);
  const registerRange = range(registers);

  const candidates = sections.map((section) => {
    const density = normalized(Number(section.metrics?.density), densityRange.min, densityRange.max);
    const velocity = normalized(Number(section.metrics?.averageVelocity), velocityRange.min, velocityRange.max);
    const register = normalized(Number(section.metrics?.averagePitch), registerRange.min, registerRange.max);
    const score = score100(0.4 * density + 0.35 * velocity + 0.25 * register);
    return Object.freeze({
      sectionId: section.id,
      label: section.label,
      startBar: section.startBar,
      endBar: section.endBar,
      score,
      evidence: Object.freeze([
        `密度 ${section.metrics?.density ?? '—'}`,
        `平均Velocity ${section.metrics?.averageVelocity ?? '—'}`,
        `平均Pitch ${section.metrics?.averagePitch ?? '—'}`,
      ]),
    });
  }).sort((a, b) => b.score - a.score || a.startBar - b.startBar);

  const top = candidates[0] ?? null;
  return Object.freeze({
    metric: Object.freeze({
      id: 'chorus-likeness',
      label: 'サビらしさ候補',
      score: top?.score ?? 0,
      summary: top ? `${top.label}（${top.startBar}-${top.endBar}小節）が最も高エネルギーなSection候補です。` : 'Section候補を算出できませんでした。',
      evidence: Object.freeze(top?.evidence ?? []),
    }),
    candidates: Object.freeze(candidates),
  });
}

function surpriseMetric(bundle) {
  const mods = bundle?.structure?.modulations ?? [];
  const modImpact = mods.length
    ? mods.reduce((sum, item) => sum + (MODULATION_IMPACT[item.relation] ?? MODULATION_IMPACT.other) * clamp01(Number(item.confidence) || 0.5), 0) / mods.length
    : 0;
  const key = bundle?.key?.candidates?.[0]?.value ?? '';
  const chords = effectiveChords(bundle);
  const outOfScaleRatio = ratio(chords.filter((chord) => degreeForPitchClass(chord.root, key)?.outOfScale).length, chords.length);
  const score = score100(0.7 * modImpact + 0.3 * outOfScaleRatio);
  return Object.freeze({
    id: 'surprise',
    label: '驚き度 / 転調Impact候補',
    score,
    summary: mods.length ? `転調候補${mods.length}件と音階外Chord候補から変化の強さを推定しています。` : '明確な転調候補は少なく、Chordの調外感を中心に推定しています。',
    evidence: Object.freeze([
      `転調候補 ${mods.length}件`,
      `音階外Chord候補 ${Math.round(outOfScaleRatio * 100)}%`,
      ...mods.slice(0, 3).map((item) => `${item.from} → ${item.to}: ${item.relation}`),
    ]),
  });
}

function repetitionVariationMetric(bundle) {
  const melodyNotes = Math.max(1, Number(bundle?.melody?.noteCount) || 1);
  const motifs = bundle?.motif?.candidates ?? [];
  const repeatedNotes = motifs.reduce((sum, motif) => sum + Math.max(0, (motif.occurrenceCount ?? 0) - 1) * (motif.noteLength ?? 0), 0);
  const repetition = clamp01(repeatedNotes / melodyNotes);
  const sections = bundle?.structure?.sections ?? [];
  const uniqueSections = new Set(sections.map((section) => section.label)).size;
  const variation = sections.length ? clamp01(uniqueSections / sections.length) : 0;
  const activity = clamp01((repetition + variation) / 1.2);
  const balance = clamp01((1 - Math.abs(repetition - variation)) * activity);
  const score = score100(balance);
  return Object.freeze({
    id: 'repetition-variation',
    label: '反復と変化のBalance候補',
    score,
    summary: repetition > variation ? '反復側の特徴がやや強めです。' : variation > repetition ? '変化側の特徴がやや強めです。' : '反復と変化が近い比率です。',
    evidence: Object.freeze([
      `Motif反復強度 ${Math.round(repetition * 100)}%`,
      `Section種類比 ${Math.round(variation * 100)}%`,
      `Motif候補 ${motifs.length}件`,
    ]),
  });
}

function counterPresenceMetric(bundle) {
  const counter = bundle?.deep?.counterMelody;
  const present = Boolean(counter?.counterTrackId && counter?.melodyTrackId);
  const motionActivity = clamp01((counter?.motion?.evaluated ?? 0) / 16);
  const gapUse = clamp01(Number(counter?.gaps?.ratio) || 0);
  const score = present ? score100(0.55 + 0.25 * motionActivity + 0.2 * gapUse) : 0;
  return Object.freeze({
    id: 'counter-presence',
    label: '裏メロ存在感候補',
    score,
    summary: present ? `${counter.counterTrackName ?? '裏メロ候補Track'}の動きと主旋律の隙間利用から推定しています。` : '比較できる裏メロ候補Trackが見つかりませんでした。',
    evidence: Object.freeze(present ? [
      `動き評価 ${counter.motion?.evaluated ?? 0}区間`,
      `主旋律の隙間利用 ${Math.round(gapUse * 100)}%`,
      `反行率 ${counter.motion?.contraryRatio == null ? '—' : `${Math.round(counter.motion.contraryRatio * 100)}%`}`,
    ] : []),
  });
}

function arrangementDensityMetric(song, bundle) {
  const quarters = Math.max(1, (Number(song?.lengthTicks) || 0) / (Number(song?.ppq) || 480));
  const noteDensity = (song?.notes?.length ?? 0) / quarters;
  const activeTracks = (song?.tracks ?? []).filter((track) => track.noteCount > 0).length;
  const polyphonyValues = (bundle?.deep?.parts?.candidates ?? []).map((item) => Number(item.polyphonyRatio)).filter(Number.isFinite);
  const polyphony = polyphonyValues.length ? polyphonyValues.reduce((sum, item) => sum + item, 0) / polyphonyValues.length : 0;
  const score = score100(0.5 * clamp01(noteDensity / 4) + 0.3 * clamp01(activeTracks / 6) + 0.2 * clamp01(polyphony / 0.5));
  return Object.freeze({
    id: 'arrangement-density',
    label: '編曲密度候補',
    score,
    summary: '全Note密度・活動Track数・同時発音傾向を合わせたMIDI上の密度指標です。Audioの音圧ではありません。',
    evidence: Object.freeze([
      `Note密度 ${noteDensity.toFixed(2)} / quarter`,
      `活動Track ${activeTracks}`,
      `平均同時発音傾向 ${Math.round(polyphony * 100)}%`,
    ]),
  });
}

export function analyzeHigherLevelMetrics(song, existingBundle = null) {
  const bundle = existingBundle ?? buildAnalysisBundle(song);
  const chorus = chorusMetric(bundle);
  const metrics = Object.freeze([
    floatingMetric(bundle),
    chorus.metric,
    surpriseMetric(bundle),
    repetitionVariationMetric(bundle),
    counterPresenceMetric(bundle),
    arrangementDensityMetric(song, bundle),
  ]);
  return Object.freeze({
    metrics,
    chorusCandidates: chorus.candidates,
    note: 'v0.9のScoreはMIDI特徴量から作る候補指標です。音楽的な正解・品質・人気を採点するものではありません。',
  });
}
