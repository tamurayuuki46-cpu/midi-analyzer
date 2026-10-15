import { analyzeDiagnosticLoop } from './analyzeDiagnosticLoop.js';

const APP_VERSION = 'v0.25-dev';

export const DIAGNOSTIC_INTENTS = Object.freeze([
  Object.freeze({
    id: 'neutral',
    label: '特徴を確認したい',
    description: '特定の方向へ寄せず、変化を試した時に違いが分かりやすい観点を優先します。',
    boosts: Object.freeze({}),
  }),
  Object.freeze({
    id: 'section-contrast',
    label: 'Sectionの差を強めたい',
    description: 'Section間の密度・Melody音域・着地の違いを比較しやすい候補を優先します。',
    boosts: Object.freeze({ 'section-density-contrast': 0.34, 'section-melody-range': 0.28, 'section-landing-variation': 0.08 }),
  }),
  Object.freeze({
    id: 'chorus-lift',
    label: 'サビ候補を持ち上げたい',
    description: 'Section名を自動でサビと断定せず、音域・密度・Climax位置の差を作る実験を優先します。',
    boosts: Object.freeze({ 'section-melody-range': 0.34, 'section-density-contrast': 0.26, 'climax-position': 0.24, 'section-landing-variation': 0.1 }),
  }),
  Object.freeze({
    id: 'harmony-tension',
    label: '緊張感・浮遊感を試したい',
    description: 'Melodyを保ちながらChord Tone比率や着地の文脈を変える比較を優先します。',
    boosts: Object.freeze({ 'melody-tension-balance': 0.4, 'section-landing-variation': 0.2 }),
  }),
  Object.freeze({
    id: 'landing-focus',
    label: '着地・終止感を変えたい',
    description: 'Section終端の着地だけを変えた時の印象差を確認しやすい候補を優先します。',
    boosts: Object.freeze({ 'section-landing-variation': 0.46, 'melody-tension-balance': 0.12 }),
  }),
  Object.freeze({
    id: 'climax-shape',
    label: 'Climax位置・展開重心を調整したい',
    description: 'Climax候補の位置と、その前後の密度・音域差を比較する候補を優先します。',
    boosts: Object.freeze({ 'climax-position': 0.46, 'section-density-contrast': 0.18, 'section-melody-range': 0.18 }),
  }),
]);

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function getIntent(intentId) {
  return DIAGNOSTIC_INTENTS.find((intent) => intent.id === intentId) ?? DIAGNOSTIC_INTENTS[0];
}

function sectionLabels(sections, ids) {
  const map = new Map(sections.map((section) => [section.sectionId, section.label]));
  return ids.map((id) => map.get(id) ?? id).join(' / ');
}

function pairBySmallestDelta(adjacent, key) {
  return [...(adjacent ?? [])]
    .filter((item) => Number.isFinite(item[key]))
    .sort((a, b) => Math.abs(a[key]) - Math.abs(b[key]))[0] ?? null;
}

function repeatedLandingSections(sections) {
  const groups = new Map();
  for (const section of sections) {
    if (!section.landingDegree) continue;
    const list = groups.get(section.landingDegree) ?? [];
    list.push(section.sectionId);
    groups.set(section.landingDegree, list);
  }
  const repeated = [...groups.entries()].find(([, ids]) => ids.length >= 2);
  if (repeated) return repeated[1].slice(0, 2);
  return sections.slice(0, 2).map((section) => section.sectionId);
}

function sectionForClimax(sections, positionRatio) {
  if (!sections.length || !Number.isFinite(positionRatio)) return [];
  const index = Math.min(sections.length - 1, Math.max(0, Math.floor(clamp01(positionRatio) * sections.length)));
  return [sections[index].sectionId];
}

function tensionTarget(sections) {
  const target = [...sections]
    .filter((section) => Number.isFinite(section.chordToneRatio))
    .sort((a, b) => Math.abs((b.chordToneRatio ?? 0.62) - 0.62) - Math.abs((a.chordToneRatio ?? 0.62) - 0.62))[0];
  return target ? [target.sectionId] : sections.slice(0, 1).map((section) => section.sectionId);
}

function buildCandidatePool(base) {
  const comparison = base.sectionComparison ?? {};
  const summary = comparison.summary ?? {};
  const sections = comparison.sections ?? [];
  const adjacent = comparison.adjacent ?? [];
  const candidates = [];

  if (sections.length >= 2 && Number.isFinite(summary.densitySpread)) {
    const pair = pairBySmallestDelta(adjacent, 'densityDelta');
    const targetSections = pair ? [pair.fromSectionId, pair.toSectionId] : sections.slice(0, 2).map((section) => section.sectionId);
    const spreadRatio = clamp01(summary.densitySpreadRatio);
    candidates.push({
      id: 'section-density-contrast',
      baseWeight: summary.densitySpreadRatio <= 0.18 ? 0.94 : 0.72 + Math.min(0.18, spreadRatio * 0.2),
      title: 'Section間の密度差を確認',
      evidence: `Note密度のSection差 ${summary.densitySpread} / 最大比 ${Math.round((summary.densitySpreadRatio ?? 0) * 100)}%`,
      meaning: summary.densitySpreadRatio <= 0.18
        ? 'Section同士のNote密度が近い傾向です。密度だけを変えると落差の違いを確認しやすくなります。'
        : 'Section間にNote密度差があります。その落差をさらに広げる案と、保つ案を比較できます。',
      action: 'Arrangement Labで、対象Sectionの発音密度だけを変えた案を比較する。',
      intent: 'section-density-contrast',
      targetSections,
      variable: 'section-note-density',
      keepConstant: ['Melodyの音程とリズム', 'Chord進行', 'Tempo'],
      choices: ['A: 対象Sectionの発音を減らす', 'B: 対象Sectionの発音を増やす', 'C: 現状を保つ'],
      verification: 'Compareの「修正前 → 修正後」でSection間Note密度差を確認する。',
    });
  }

  if (sections.length >= 2 && Number.isFinite(summary.melodyRangeSpread)) {
    const pair = pairBySmallestDelta(adjacent, 'melodyRangeDelta');
    const targetSections = pair ? [pair.fromSectionId, pair.toSectionId] : sections.slice(0, 2).map((section) => section.sectionId);
    candidates.push({
      id: 'section-melody-range',
      baseWeight: summary.melodyRangeSpread <= 2 ? 0.9 : 0.7 + Math.min(0.16, summary.melodyRangeSpread / 48),
      title: 'SectionごとのMelody音域を確認',
      evidence: `Section別Melody音域差 ${summary.melodyRangeSpread} semitone`,
      meaning: summary.melodyRangeSpread <= 2
        ? '各SectionのMelody音域が近い傾向です。音域だけを変える実験で開放感の差を確認できます。'
        : 'SectionごとのMelody音域に差があります。どこで広げる/狭めるかを意図と照合できます。',
      action: 'Arrangement Labで、対象SectionだけMelody音域を広げる/狭める案を比較する。',
      intent: 'section-melody-range',
      targetSections,
      variable: 'melody-range',
      keepConstant: ['Melodyの基本リズム', 'Chord進行', '伴奏密度'],
      choices: ['A: 対象Sectionだけ音域を広げる', 'B: 対象Sectionだけ音域を狭める', 'C: 現状を保つ'],
      verification: 'CompareでSection間Melody音域差と曲全体Melody音域を確認する。',
    });
  }

  if (sections.length && summary.landingDegreeVariety > 0) {
    const targetSections = repeatedLandingSections(sections);
    candidates.push({
      id: 'section-landing-variation',
      baseWeight: summary.landingDegreeVariety === 1 ? 0.88 : 0.69,
      title: 'Section終端の着地を確認',
      evidence: `${sections.length} Sectionで着地Degree ${summary.landingDegreeVariety}種類`,
      meaning: summary.landingDegreeVariety === 1
        ? 'Section終端の着地Degreeが揃っています。終端だけを変えると終止感の違いを確認しやすくなります。'
        : 'Sectionごとに異なる着地が使われています。終端だけを変えて役割の違いを比較できます。',
      action: 'Arrangement Labで、対象Section終端だけ着地音/Voicing/Reharmonizeを変えた案を比較する。',
      intent: 'section-landing-variation',
      targetSections,
      variable: 'section-landing',
      keepConstant: ['Section終端以外のMelody', 'Tempo', '大枠のSection長'],
      choices: ['A: より安定する着地候補を試す', 'B: 余韻を残す着地候補を試す', 'C: 現状を保つ'],
      verification: 'Compareで着地Degree種類数と、該当SectionのLanding relationを確認する。',
    });
  }

  if (Number.isFinite(summary.averageChordToneRatio)) {
    const distance = Math.abs(summary.averageChordToneRatio - 0.62);
    const targetSections = tensionTarget(sections);
    candidates.push({
      id: 'melody-tension-balance',
      baseWeight: 0.62 + Math.min(0.2, distance * 0.35),
      title: 'Chord Tone / Non-Chord Toneの比率を確認',
      evidence: `Section平均Chord Tone率 ${Math.round(summary.averageChordToneRatio * 100)}%`,
      meaning: '比率そのものに正解はありません。同じMelodyを保ち、Harmony側だけ変えると緊張感の差を比較できます。',
      action: 'Arrangement Labで、同じMelodyを保ちながらChord/Voicingだけ変えた案を比較する。',
      intent: 'melody-harmony-tension',
      targetSections,
      variable: 'harmony-context',
      keepConstant: ['Melody Note', 'Melodyリズム', 'Tempo'],
      choices: ['A: Chord Toneとして聞こえやすいHarmony候補', 'B: Non-Chord Toneの緊張を残すHarmony候補', 'C: 現状を保つ'],
      verification: 'Compareで平均Chord Tone率を確認し、Note FunctionのResolutionも聴き比べる。',
    });
  }

  const climaxPosition = base.insight?.contour?.climaxCandidate?.positionRatio;
  if (Number.isFinite(climaxPosition)) {
    const targetSections = sectionForClimax(sections, climaxPosition);
    candidates.push({
      id: 'climax-position',
      baseWeight: climaxPosition < 0.25 || climaxPosition > 0.85 ? 0.75 : 0.58,
      title: 'Climax候補の位置を確認',
      evidence: `Climax候補は曲全体の約${Math.round(climaxPosition * 100)}%地点`,
      meaning: 'Climax位置は正解判定ではありません。Melodyを変えずに編曲密度だけ動かし、重心の違いを比較できます。',
      action: 'Arrangement Labで、同じ素材のまま楽器参加・密度・VoicingでClimax候補の重心を前後させた案を比較する。',
      intent: 'climax-position',
      targetSections,
      variable: 'arrangement-climax-position',
      keepConstant: ['Melody Note', 'Chord進行', 'Tempo'],
      choices: ['A: Climax感を少し前へ寄せる', 'B: Climax感を少し後ろへ寄せる', 'C: 現状を保つ'],
      verification: 'CompareでClimax候補位置とSection間Note密度差を確認する。',
    });
  }

  return candidates;
}

function buildRationale(candidate, intent, sections) {
  const target = candidate.targetSections.length ? sectionLabels(sections, candidate.targetSections) : '曲全体';
  if (intent.id === 'neutral') {
    return `${target}で「${candidate.title}」を1項目だけ試すと、修正前後の差を切り分けて確認しやすいため候補にしました。`;
  }
  return `今回の目的「${intent.label}」と ${candidate.evidence} がつながるため、${target}で1項目だけ比較する候補にしました。品質の良し悪しを判定したものではありません。`;
}

function freezePriority(candidate, intent, sections, priority) {
  return Object.freeze({
    priority,
    id: candidate.id,
    title: candidate.title,
    evidence: candidate.evidence,
    meaning: candidate.meaning,
    rationale: buildRationale(candidate, intent, sections),
    action: candidate.action,
    intent: candidate.intent,
    targetSections: Object.freeze([...candidate.targetSections]),
    experiment: Object.freeze({
      id: `experiment:${candidate.id}`,
      variable: candidate.variable,
      targetSections: Object.freeze([...candidate.targetSections]),
      keepConstant: Object.freeze([...candidate.keepConstant]),
      choices: Object.freeze([...candidate.choices]),
      verification: candidate.verification,
    }),
  });
}

export function analyzeIntentDiagnostic(song, options = {}) {
  const base = options.baseDiagnostic ?? analyzeDiagnosticLoop(song, options.analysisOptions ?? options);
  const intent = getIntent(options.intentId);
  const sections = base.sectionComparison?.sections ?? [];
  const priorities = buildCandidatePool(base)
    .map((candidate) => ({
      ...candidate,
      score: candidate.baseWeight + (intent.boosts[candidate.id] ?? 0),
    }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 3)
    .map((candidate, index) => freezePriority(candidate, intent, sections, index + 1));

  return Object.freeze({
    ...base,
    version: APP_VERSION,
    baseVersion: base.version,
    userIntent: Object.freeze({ id: intent.id, label: intent.label, description: intent.description }),
    priorities: Object.freeze(priorities),
    note: '優先順位はユーザーの目的とEvidenceを照合した「比較しやすさ」の順です。品質Scoreや正解判定ではありません。',
  });
}

export function buildSingleVariableExperiment(diagnostic, priorityId) {
  const selected = (diagnostic?.priorities ?? []).find((item) => item.id === priorityId)
    ?? diagnostic?.priorities?.[0]
    ?? null;
  if (!selected) return null;
  return Object.freeze({
    priorityId: selected.id,
    title: selected.title,
    rationale: selected.rationale,
    ...selected.experiment,
  });
}

export function buildIntentArrangementHandoff(song, diagnostic = analyzeIntentDiagnostic(song), priorityId = null) {
  const selected = (diagnostic?.priorities ?? []).find((item) => item.id === priorityId)
    ?? diagnostic?.priorities?.[0]
    ?? null;
  const priorities = selected ? [selected] : [];
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
    userIntent: diagnostic?.userIntent ?? getIntent('neutral'),
    priorities: Object.freeze(priorities.map((item) => Object.freeze({
      priority: 1,
      id: item.id,
      title: item.title,
      evidence: item.evidence,
      meaning: item.meaning,
      rationale: item.rationale,
      action: item.action,
      intent: item.intent,
      targetSections: Object.freeze([...(item.targetSections ?? [])]),
    }))),
    experiment: selected ? buildSingleVariableExperiment(diagnostic, selected.id) : null,
    note: '1回に1項目だけ試すproposal-only handoffです。MIDI Analyzerは自動適用せず、Arrangement Labで案を作り、Compareで修正前後を再分析します。',
  });
}
