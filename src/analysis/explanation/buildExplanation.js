import { analyzeHigherLevelMetrics } from '../metrics/index.js';
import { buildAnalysisBundle } from '../summary/index.js';

function pct(value) {
  return Number.isFinite(value) ? `${Math.round(value * 100)}%` : '—';
}

function scoreById(metrics, id) {
  return metrics?.metrics?.find((item) => item.id === id)?.score ?? 0;
}

function topChordNames(bundle, limit = 8) {
  return (bundle?.topChordProgression ?? []).map((item) => item.value).filter(Boolean).slice(0, limit);
}

function buildLearnings(bundle, metrics) {
  const result = [];
  const key = bundle?.key?.candidates?.[0];
  if (key) result.push(`調中心の第1候補は${key.value}。一致度は${pct(key.confidence)}なので、候補2位との差も見ながら判断できます。`);

  const progression = topChordNames(bundle, 6);
  if (progression.length) result.push(`コードのTop 1候補は「${progression.join(' → ')}」から始まります。進行全体ではなく、区間ごとの候補順位として読むのが安全です。`);

  const motifs = bundle?.motif?.candidates ?? [];
  if (motifs.length) {
    const motif = motifs[0];
    result.push(`Motif候補が${motifs.length}件あり、先頭候補は${motif.noteLength ?? '複数'}音単位で${motif.occurrenceCount ?? 0}回現れます。反復の作り方を学ぶ材料になります。`);
  }

  const sections = bundle?.structure?.sections ?? [];
  if (sections.length > 1) {
    const labels = sections.map((item) => item.label).join(' → ');
    result.push(`4小節BlockのSection候補は「${labels}」。同じLabelが戻る位置を見ると、反復と対比の設計を追えます。`);
  }

  const mods = bundle?.structure?.modulations ?? [];
  if (mods.length) {
    const first = mods[0];
    result.push(`転調候補は${mods.length}件。最初はBar ${first.atBar}付近の${first.from} → ${first.to}（${first.relation}）です。変化前後の共通音やBassを確認する入口になります。`);
  }

  const counter = bundle?.deep?.counterMelody;
  if (counter?.counterTrackId) {
    result.push(`裏メロ候補Trackでは、反行${pct(counter.motion?.contraryRatio)}・主旋律の隙間利用${pct(counter.gaps?.ratio)}。主旋律と同時に動く量と、休符を埋める量の両方を比較できます。`);
  }

  const chorus = metrics?.chorusCandidates?.[0];
  if (chorus) result.push(`サビらしさ候補が最も高いのは${chorus.label}（${chorus.startBar}-${chorus.endBar}小節）。密度・Velocity・Registerの相対上昇が根拠です。`);

  return Object.freeze(result.slice(0, 7));
}

function buildApplications(bundle, metrics) {
  const result = [];
  const floating = scoreById(metrics, 'floating');
  const surprise = scoreById(metrics, 'surprise');
  const repetition = scoreById(metrics, 'repetition-variation');
  const counter = scoreById(metrics, 'counter-presence');
  const density = scoreById(metrics, 'arrangement-density');

  if (floating >= 55) result.push('浮遊感を応用する候補: maj7 / m7 / sus系などの色付きChord、非Chord Tone、調中心の移動を1要素ずつ試し、どれが効いているかA/B比較する。');
  else result.push('浮遊感を足す候補: まず1か所だけsus系やmaj7系の色付け、または主旋律の経過音を増やして変化を比較する。');

  if (surprise >= 50) result.push('驚き度を応用する候補: 強い変化の直前2小節を保守的にして、変化点とのコントラストを大きくする。');
  else result.push('驚きを増やす候補: Section境界でBass・Chord・休符のどれか1つだけ予想外の変化を置き、全要素を同時に変えすぎない。');

  if (repetition >= 55) result.push('Motifの再利用候補: 同じ輪郭を保ちながら、開始音・リズム末尾・Registerのどれか1つだけ変えた派生案を作る。');
  else result.push('反復を強める候補: 2〜4音の短いMotifを決め、別Sectionで移調またはリズム変形して再登場させる。');

  if (counter >= 50) result.push('裏メロ応用候補: 主旋律が動く場所では反行/斜行、主旋律が休む場所では隙間を埋める案を別Takeとして比較する。');
  else result.push('裏メロ追加候補: まず主旋律の長い休符だけを狙い、常時鳴らさずSparseな案から試す。');

  if (density >= 65) result.push('編曲密度が高めなので、次のDraftでは1パートMuteした版も残し、情報量を減らしたA/Bを比較する。');
  else if (density <= 35) result.push('編曲密度が低めなので、同じ和声を壊さずにRhythmまたはCounter Melodyを1レイヤーだけ追加する案を試せます。');

  return Object.freeze(result.slice(0, 6));
}

function buildKeyExplanation(bundle) {
  const candidates = bundle?.key?.candidates ?? [];
  const first = candidates[0];
  if (!first) return 'Key候補を算出できませんでした。Drum以外のPitch情報が不足している可能性があります。';
  const second = candidates[1];
  const gap = second ? Math.max(0, (first.confidence ?? 0) - (second.confidence ?? 0)) : null;
  return `第1候補は${first.value}（一致度 ${pct(first.confidence)}）です。${second ? `第2候補は${second.value}（${pct(second.confidence)}）で、差は${pct(gap)}です。` : ''} 一致度は確率ではなく、Pitch Class分布との適合度です。`;
}

function buildHarmonyExplanation(bundle) {
  const progression = topChordNames(bundle, 10);
  if (!progression.length) return 'Chord候補を算出できませんでした。Chord分析対象Trackが不足している可能性があります。';
  const unique = new Set(progression).size;
  return `Top 1候補を時系列に並べると「${progression.join(' → ')}」。先頭${progression.length}区間で${unique}種類のChord候補が使われています。手動選択前の仮進行なので、耳で確認してから採用してください。`;
}

function buildModulationExplanation(bundle) {
  const mods = bundle?.structure?.modulations ?? [];
  if (!mods.length) return '4小節Block間で明確なKey変化候補は検出されませんでした。局所的な借用和音や短いトニック化は別途確認が必要です。';
  return mods.slice(0, 4).map((item) => `Bar ${item.atBar}: ${item.from} → ${item.to}。関係は${item.relation}、一致度の下限は${pct(item.confidence)}。`).join(' ');
}

export function buildExplanationReport(song, existingBundle = null, existingMetrics = null) {
  const bundle = existingBundle ?? buildAnalysisBundle(song);
  const metrics = existingMetrics ?? analyzeHigherLevelMetrics(song, bundle);
  const learnings = buildLearnings(bundle, metrics);
  const applications = buildApplications(bundle, metrics);
  return Object.freeze({
    engine: 'local-explainability-v1',
    generatedLocally: true,
    overview: `${bundle?.source?.fileName ?? 'このMIDI'}を、Key / Chord / Melody / Bass / Rhythm / Motif / Structure / Part特徴から説明します。外部AIへデータは送信していません。`,
    whyKey: buildKeyExplanation(bundle),
    harmony: buildHarmonyExplanation(bundle),
    modulation: buildModulationExplanation(bundle),
    learnings,
    applications,
    metrics,
    note: 'この説明はMIDI Analyzerの候補解析を自然言語化したExplainability機能です。生成AIモデルによる断定ではなく、表示された根拠からユーザーが判断するための補助です。',
  });
}

export function buildAiPrompt(bundle, report) {
  const progression = topChordNames(bundle, 16).join(' → ');
  const mods = (bundle?.structure?.modulations ?? []).map((item) => `${item.from}->${item.to} at bar ${item.atBar}`).join(', ');
  const metrics = (report?.metrics?.metrics ?? []).map((item) => `${item.label}:${item.score}/100`).join(', ');
  return [
    '以下はMIDI Analyzerの解析候補です。断定せず、根拠と不確実性を示しながら作曲学習向けに説明してください。',
    `Source: ${bundle?.source?.fileName ?? 'unknown'}`,
    `Key candidate: ${bundle?.key?.candidates?.[0]?.value ?? 'unknown'}`,
    `Chord candidates: ${progression || 'none'}`,
    `Modulation candidates: ${mods || 'none'}`,
    `Metrics: ${metrics || 'none'}`,
    '出力: 1) この曲から学べること 2) 主旋律/裏メロ/和声/リズム/音色への応用候補 3) 注意すべき不確実性',
  ].join('\n');
}
