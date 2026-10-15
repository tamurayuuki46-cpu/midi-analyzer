import { getDefaultMelodyTrackId } from '../basic/index.js';
import { analyzeChords } from '../chord/index.js';
import { analyzeSongInsights } from '../insight/index.js';
import { analyzeKeyScale } from '../key/index.js';
import { analyzeNoteFunctions } from '../note-function/index.js';
import { analyzeStructure } from '../structure/index.js';

const APP_VERSION = 'v0.24-dev';

function round(value, digits = 3) {
  if (!Number.isFinite(value)) return null;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function ratio(value) {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : null;
}

function average(values) {
  const valid = values.filter(Number.isFinite);
  if (!valid.length) return null;
  return round(valid.reduce((sum, value) => sum + value, 0) / valid.length, 3);
}

function range(values) {
  const valid = values.filter(Number.isFinite);
  if (!valid.length) return null;
  return Object.freeze({ min: Math.min(...valid), max: Math.max(...valid), spread: round(Math.max(...valid) - Math.min(...valid), 3) });
}

function effectiveChordSegments(chords) {
  return (chords?.segments ?? []).map((segment) => Object.freeze({
    ...segment,
    effectiveCandidate: segment.effectiveCandidate ?? segment.selectedCandidate ?? segment.candidates?.[0] ?? null,
  }));
}

function melodyNotesForSection(song, trackId, section) {
  return (song?.notes ?? []).filter((note) => (
    note.trackId === trackId
    && note.channel !== 9
    && note.durationTick > 0
    && note.startTick >= section.startTick
    && note.startTick < section.endTick
  ));
}

function noteFunctionForSection(noteFunction, section) {
  return (noteFunction?.notes ?? []).filter((detail) => (
    detail.startTick >= section.startTick && detail.startTick < section.endTick
  ));
}

function chordToneRatio(details) {
  const evaluated = details.filter((item) => typeof item.chordTone === 'boolean');
  if (!evaluated.length) return null;
  return round(evaluated.filter((item) => item.chordTone).length / evaluated.length, 4);
}

function pitchRange(notes) {
  const pitches = notes.map((note) => note.pitch).filter(Number.isFinite);
  if (!pitches.length) return null;
  return Math.max(...pitches) - Math.min(...pitches);
}

function signed(value, suffix = '') {
  if (!Number.isFinite(value)) return '—';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${round(value, 2)}${suffix}`;
}

function describeDelta(label, value, { threshold = 0, suffix = '', higher = '高い', lower = '低い' } = {}) {
  if (!Number.isFinite(value)) return `${label}は比較できません。`;
  if (Math.abs(value) <= threshold) return `${label}はほぼ同じです。`;
  return `${label}は${signed(Math.abs(value), suffix)} ${value > 0 ? higher : lower}です。`;
}

function buildAdjacentComparison(previous, current) {
  const densityDelta = Number.isFinite(previous.density) && Number.isFinite(current.density)
    ? round(current.density - previous.density, 3)
    : null;
  const melodyRangeDelta = Number.isFinite(previous.melodyRangeSemitones) && Number.isFinite(current.melodyRangeSemitones)
    ? round(current.melodyRangeSemitones - previous.melodyRangeSemitones, 3)
    : null;
  const chordToneDelta = Number.isFinite(previous.chordToneRatio) && Number.isFinite(current.chordToneRatio)
    ? round(current.chordToneRatio - previous.chordToneRatio, 4)
    : null;

  const descriptions = [
    describeDelta('Note密度', densityDelta, { threshold: 0.1, suffix: '/quarter', higher: '高い', lower: '低い' }),
    describeDelta('Melody音域', melodyRangeDelta, { threshold: 1, suffix: 'st', higher: '広い', lower: '狭い' }),
  ];
  if (Number.isFinite(chordToneDelta)) {
    descriptions.push(describeDelta('Chord Tone率', chordToneDelta, { threshold: 0.05, suffix: '', higher: '高い', lower: '低い' }));
  }

  return Object.freeze({
    fromSectionId: previous.sectionId,
    fromLabel: previous.label,
    toSectionId: current.sectionId,
    toLabel: current.label,
    densityDelta,
    melodyRangeDelta,
    chordToneRatioDelta: chordToneDelta,
    meaning: `${current.label}は${previous.label}と比べて、${descriptions.join(' ')}`,
  });
}

function buildMetricMeanings(summary, sections) {
  const items = [];
  if (Number.isFinite(summary.densitySpread)) {
    items.push(Object.freeze({
      id: 'section-density',
      title: 'Section間のNote密度',
      evidence: `最小 ${summary.densityRange?.min ?? '—'} / 最大 ${summary.densityRange?.max ?? '—'} / 差 ${summary.densitySpread}`,
      meaning: summary.densitySpreadRatio <= 0.18
        ? 'Section同士の発音密度は近い傾向です。落差を作りたい場合は編曲案を比較できます。'
        : 'Section間で発音密度に差があります。その差が意図した展開か確認できます。',
    }));
  }
  if (Number.isFinite(summary.melodyRangeSpread)) {
    items.push(Object.freeze({
      id: 'section-melody-range',
      title: 'Section別Melody音域',
      evidence: `最小 ${summary.melodyRangeRange?.min ?? '—'}st / 最大 ${summary.melodyRangeRange?.max ?? '—'}st / 差 ${summary.melodyRangeSpread}st`,
      meaning: summary.melodyRangeSpread <= 2
        ? 'SectionごとのMelody音域は近い傾向です。音域差を演出したい場合の比較材料になります。'
        : 'SectionごとにMelody音域が変化しています。どの区間で広がるかを確認できます。',
    }));
  }
  if (Number.isFinite(summary.averageChordToneRatio)) {
    items.push(Object.freeze({
      id: 'section-chord-tone',
      title: 'MelodyのChord Tone率',
      evidence: `Section平均 ${Math.round(summary.averageChordToneRatio * 100)}%`,
      meaning: summary.averageChordToneRatio >= 0.78
        ? 'Chord Tone上のMelody Noteが多い傾向です。緊張感を変えたい場合はNon-Chord Toneを含む案と比較できます。'
        : summary.averageChordToneRatio <= 0.45
          ? 'Non-Chord Toneを含むMelody Noteが比較的多い傾向です。解決先や着地を確認する材料になります。'
          : 'Chord ToneとNon-Chord Toneが混在しています。Section別の割合差を見ると特徴を把握しやすくなります。',
    }));
  }
  if (summary.landingDegreeVariety > 0) {
    items.push(Object.freeze({
      id: 'section-landing',
      title: 'Section終端の着地Degree',
      evidence: `${sections.length} Section中 ${summary.landingDegreeVariety}種類`,
      meaning: summary.landingDegreeVariety === 1
        ? 'Section終端の着地Degreeが揃っています。着地だけ変えた案を比較すると違いを確認できます。'
        : 'Sectionごとに異なる着地Degreeが使われています。展開ごとの終止感の違いを確認できます。',
    }));
  }
  return Object.freeze(items);
}

export function analyzeSectionComparison(song, options = {}) {
  const structure = options.structure ?? analyzeStructure(song);
  const keyValue = options.keyValue ?? analyzeKeyScale(song).candidates?.[0]?.value ?? null;
  const chordSegments = options.chordSegments ?? effectiveChordSegments(analyzeChords(song));
  const trackId = options.trackId ?? getDefaultMelodyTrackId(song);
  const insight = options.insight ?? analyzeSongInsights(song, { structure, keyValue, chordSegments, trackId });
  const noteFunction = analyzeNoteFunctions(song, {
    trackId,
    keyValue,
    keySource: 'candidate',
    chordSegments,
    sectionBoundaries: (structure?.sections ?? []).slice(0, -1).map((section) => section.endTick),
  });
  const landingBySection = new Map((insight?.landingComparison?.entries ?? []).map((entry) => [entry.sectionId, entry]));

  const sections = Object.freeze((structure?.sections ?? []).map((section) => {
    const melodyNotes = melodyNotesForSection(song, trackId, section);
    const functionDetails = noteFunctionForSection(noteFunction, section);
    const landing = landingBySection.get(section.id) ?? null;
    return Object.freeze({
      sectionId: section.id,
      label: section.label,
      startBar: section.startBar,
      endBar: section.endBar,
      density: Number.isFinite(section.metrics?.density) ? round(section.metrics.density, 3) : null,
      allNoteCount: section.metrics?.noteCount ?? null,
      averagePitch: Number.isFinite(section.metrics?.averagePitch) ? round(section.metrics.averagePitch, 2) : null,
      melodyNoteCount: melodyNotes.length,
      melodyRangeSemitones: pitchRange(melodyNotes),
      chordToneRatio: chordToneRatio(functionDetails),
      landingDegree: landing?.degree ?? null,
      landingPitchName: landing?.pitchName ?? null,
      landingRelation: landing?.relation ?? 'unknown',
    });
  }));

  const adjacent = Object.freeze(sections.slice(1).map((section, index) => buildAdjacentComparison(sections[index], section)));
  const densityRange = range(sections.map((section) => section.density));
  const melodyRangeRange = range(sections.map((section) => section.melodyRangeSemitones));
  const densitySpread = densityRange?.spread ?? null;
  const densitySpreadRatio = densityRange && densityRange.max > 0 ? round(densityRange.spread / densityRange.max, 4) : null;
  const landingDegreeVariety = new Set(sections.map((section) => section.landingDegree).filter(Boolean)).size;
  const summary = Object.freeze({
    sectionCount: sections.length,
    densityRange,
    densitySpread,
    densitySpreadRatio,
    melodyRangeRange,
    melodyRangeSpread: melodyRangeRange?.spread ?? null,
    averageChordToneRatio: average(sections.map((section) => section.chordToneRatio)),
    landingDegreeVariety,
  });

  return Object.freeze({
    trackId,
    keyValue,
    sections,
    adjacent,
    summary,
    metricMeanings: buildMetricMeanings(summary, sections),
    note: 'Section比較は観測値の差を説明します。大きい/小さいを品質の良し悪しとして採点しません。',
  });
}

function priorityCandidates(sectionComparison, insight) {
  const summary = sectionComparison.summary ?? {};
  const sections = sectionComparison.sections ?? [];
  const candidates = [];

  if (sections.length >= 2 && Number.isFinite(summary.densitySpread)) {
    const ratioValue = ratio(summary.densitySpreadRatio) ?? 0;
    candidates.push({
      id: 'section-density-contrast',
      weight: summary.densitySpreadRatio <= 0.18 ? 0.94 : 0.72 + Math.min(0.18, ratioValue * 0.2),
      title: 'Section間の密度差を確認',
      evidence: `Note密度のSection差 ${summary.densitySpread} / 最大比 ${Math.round((summary.densitySpreadRatio ?? 0) * 100)}%`,
      meaning: summary.densitySpreadRatio <= 0.18
        ? 'Section同士のNote密度が近いため、落差を出したい場合は変化案を比較しやすい箇所です。'
        : 'Section間のNote密度差が見えています。その落差を保つ/緩める両案を比較できます。',
      action: 'Arrangement Labで、隣接Sectionの片方を「引き算」と「足し算」の2案にして比較する。',
      intent: 'section-density-contrast',
      targetSections: sections.map((section) => section.sectionId),
    });
  }

  if (sections.length >= 2 && Number.isFinite(summary.melodyRangeSpread)) {
    candidates.push({
      id: 'section-melody-range',
      weight: summary.melodyRangeSpread <= 2 ? 0.9 : 0.7 + Math.min(0.16, summary.melodyRangeSpread / 48),
      title: 'SectionごとのMelody音域を確認',
      evidence: `Section別Melody音域差 ${summary.melodyRangeSpread} semitone`,
      meaning: summary.melodyRangeSpread <= 2
        ? '各SectionのMelody音域が近いため、開放感や抑制を付けたい場合の比較候補です。'
        : 'SectionごとのMelody音域に差があります。どこで広げる/狭めるかを意図と照合できます。',
      action: 'Arrangement Labで、対象Sectionだけ音域を広げる案/保つ案を比較する。',
      intent: 'section-melody-range',
      targetSections: sections.map((section) => section.sectionId),
    });
  }

  if (sections.length && summary.landingDegreeVariety > 0) {
    candidates.push({
      id: 'section-landing-variation',
      weight: summary.landingDegreeVariety === 1 ? 0.88 : 0.69,
      title: 'Section終端の着地を確認',
      evidence: `${sections.length} Sectionで着地Degree ${summary.landingDegreeVariety}種類`,
      meaning: summary.landingDegreeVariety === 1
        ? 'Section終端の着地Degreeが揃っています。終止感を変えたい場合に着地案を比較できます。'
        : 'Sectionごとに異なる着地が使われています。役割の違いが意図通りか確認できます。',
      action: 'Arrangement Labで、Section終端だけ着地音/Voicing/Reharmonizeを変えた案を比較する。',
      intent: 'section-landing-variation',
      targetSections: sections.map((section) => section.sectionId),
    });
  }

  if (Number.isFinite(summary.averageChordToneRatio)) {
    const distance = Math.abs(summary.averageChordToneRatio - 0.62);
    candidates.push({
      id: 'melody-tension-balance',
      weight: 0.62 + Math.min(0.2, distance * 0.35),
      title: 'Chord Tone / Non-Chord Toneの比率を確認',
      evidence: `Section平均Chord Tone率 ${Math.round(summary.averageChordToneRatio * 100)}%`,
      meaning: '比率そのものに正解はありません。緊張と解決の印象を変えたい場合の実験候補です。',
      action: 'Arrangement Labで、同じMelodyを保ちながらChord/Voicingだけ変えた案を比較する。',
      intent: 'melody-harmony-tension',
      targetSections: sections.map((section) => section.sectionId),
    });
  }

  const climaxPosition = insight?.contour?.climaxCandidate?.positionRatio;
  if (Number.isFinite(climaxPosition)) {
    candidates.push({
      id: 'climax-position',
      weight: climaxPosition < 0.25 || climaxPosition > 0.85 ? 0.75 : 0.58,
      title: 'Climax候補の位置を確認',
      evidence: `Climax候補は曲全体の約${Math.round(climaxPosition * 100)}%地点`,
      meaning: 'Climax位置は正解判定ではなく、展開の重心を確認するための観測です。',
      action: 'Arrangement Labで、同じ素材のまま楽器参加・密度・VoicingでClimax位置を前後させた案を比較する。',
      intent: 'climax-position',
      targetSections: [],
    });
  }

  return candidates;
}

export function buildReviewPriorities(sectionComparison, insight) {
  return Object.freeze(priorityCandidates(sectionComparison, insight)
    .sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id))
    .slice(0, 3)
    .map(({ weight, ...candidate }, index) => Object.freeze({ priority: index + 1, ...candidate })));
}

export function analyzeDiagnosticLoop(song, options = {}) {
  const structure = options.structure ?? analyzeStructure(song);
  const keyValue = options.keyValue ?? analyzeKeyScale(song).candidates?.[0]?.value ?? null;
  const chordSegments = options.chordSegments ?? effectiveChordSegments(analyzeChords(song));
  const trackId = options.trackId ?? getDefaultMelodyTrackId(song);
  const insight = options.insight ?? analyzeSongInsights(song, { structure, keyValue, chordSegments, trackId });
  const sectionComparison = analyzeSectionComparison(song, { structure, keyValue, chordSegments, trackId, insight });
  const priorities = buildReviewPriorities(sectionComparison, insight);

  return Object.freeze({
    version: APP_VERSION,
    trackId,
    keyValue,
    sectionComparison,
    metricMeanings: sectionComparison.metricMeanings,
    priorities,
    insight,
    note: '優先順位は「良い/悪い」の採点ではなく、変化を試した時に違いを確認しやすい観点の順です。',
  });
}

export function buildArrangementLabHandoff(song, diagnostic = analyzeDiagnosticLoop(song)) {
  return Object.freeze({
    schemaVersion: 1,
    type: 'midi-analyzer-arrangement-handoff',
    source: Object.freeze({
      app: 'midi-analyzer',
      version: APP_VERSION,
      fileName: song?.source?.fileName ?? 'untitled.mid',
      ppq: Number(song?.ppq) || null,
    }),
    mode: 'proposal-only',
    priorities: Object.freeze((diagnostic?.priorities ?? []).map((item) => Object.freeze({
      priority: item.priority,
      id: item.id,
      title: item.title,
      evidence: item.evidence,
      meaning: item.meaning,
      action: item.action,
      intent: item.intent,
      targetSections: Object.freeze([...(item.targetSections ?? [])]),
    }))),
    note: 'MIDI Analyzerは観測と提案だけを渡します。実際のReharmonize、Voicing、密度変更、採用判断はArrangement Lab側で行います。',
  });
}

function changeItem(id, title, before, after, { suffix = '', percentage = false } = {}) {
  if (!Number.isFinite(before) || !Number.isFinite(after)) return null;
  const deltaValue = round(after - before, percentage ? 4 : 3);
  let meaning = `${title}はほぼ同じです。`;
  const threshold = percentage ? 0.03 : 0.1;
  if (Math.abs(deltaValue) > threshold) {
    meaning = `${title}は修正前より${deltaValue > 0 ? '増えました' : '減りました'}。`;
  }
  const format = (value) => percentage ? `${Math.round(value * 100)}%` : `${round(value, 2)}${suffix}`;
  return Object.freeze({
    id,
    title,
    before,
    after,
    delta: deltaValue,
    evidence: `修正前 ${format(before)} / 修正後 ${format(after)}`,
    meaning,
  });
}

export function compareDiagnosticSongs(beforeSong, afterSong, options = {}) {
  const before = analyzeDiagnosticLoop(beforeSong, options.beforeOptions ?? {});
  const after = analyzeDiagnosticLoop(afterSong, options.afterOptions ?? {});
  const beforeSummary = before.sectionComparison.summary;
  const afterSummary = after.sectionComparison.summary;

  const changes = Object.freeze([
    changeItem('section-density-spread', 'Section間Note密度差', beforeSummary.densitySpread, afterSummary.densitySpread),
    changeItem('section-range-spread', 'Section間Melody音域差', beforeSummary.melodyRangeSpread, afterSummary.melodyRangeSpread, { suffix: 'st' }),
    changeItem('landing-variety', '着地Degree種類数', beforeSummary.landingDegreeVariety, afterSummary.landingDegreeVariety),
    changeItem('chord-tone-ratio', '平均Chord Tone率', beforeSummary.averageChordToneRatio, afterSummary.averageChordToneRatio, { percentage: true }),
    changeItem('whole-melody-range', '曲全体Melody音域', before.insight?.contour?.rangeSemitones, after.insight?.contour?.rangeSemitones, { suffix: 'st' }),
    changeItem('climax-position', 'Climax候補位置', before.insight?.contour?.climaxCandidate?.positionRatio, after.insight?.contour?.climaxCandidate?.positionRatio, { percentage: true }),
  ].filter(Boolean));

  const priorityFollowUp = Object.freeze((before.priorities ?? []).map((priority) => {
    const afterPriority = (after.priorities ?? []).find((item) => item.id === priority.id) ?? null;
    return Object.freeze({
      id: priority.id,
      title: priority.title,
      beforeEvidence: priority.evidence,
      afterEvidence: afterPriority?.evidence ?? '修正後はTop 3対象外',
      status: afterPriority ? 'still-visible' : 'changed-or-lower-priority',
    });
  }));

  return Object.freeze({
    before,
    after,
    changes,
    priorityFollowUp,
    note: '修正前後の差を再分析して表示します。変化量は改善度や品質Scoreではありません。',
  });
}
