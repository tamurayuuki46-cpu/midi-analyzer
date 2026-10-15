import {
  analyzeMelody,
  analyzeRhythm,
  formatMidiPitch,
  getDefaultMelodyTrackId,
  getDefaultRhythmTrackIds,
} from '../basic/index.js';
import { analyzeKeyScale } from '../key/index.js';
import { analyzeMotifs } from '../motif/index.js';

function rangeLabel(semitones) {
  if (!Number.isFinite(semitones)) return '判定しにくい';
  if (semitones <= 7) return 'せまめ';
  if (semitones <= 16) return 'ちょうど';
  return '広め';
}

function movementLabel(averageSemitones) {
  if (!Number.isFinite(averageSemitones)) return '判定しにくい';
  if (averageSemitones <= 2.5) return 'なめらか';
  if (averageSemitones <= 5) return 'ほどよく動く';
  return 'ジャンプが多め';
}

function rhythmLabel(offBeatRatio, onsetCount) {
  if (!onsetCount) return '判定しにくい';
  if (offBeatRatio <= 0.15) return '拍頭中心';
  if (offBeatRatio <= 0.45) return '拍頭と外側が混在';
  return '拍頭以外が多め';
}

function repetitionLabel(motifCount, melodyNoteCount) {
  if (motifCount > 0) return '反復候補あり';
  if (melodyNoteCount < 8) return 'まだ判定しにくい';
  return '反復少なめ';
}

function dedupe(items) {
  return [...new Set(items.filter(Boolean))];
}

function freezeList(items) {
  return Object.freeze(items.map((item) => Object.freeze(item)));
}

function metric({ id, label, value, detail, meaning, actions = [] }) {
  return {
    id,
    label,
    value,
    detail,
    meaning,
    actions: Object.freeze(dedupe(actions).slice(0, 2)),
  };
}

function referenceInsight(id, label, trait, action) {
  return Object.freeze({ id, label, trait, action });
}

export function buildBeginnerSummary(song, options = {}) {
  const melodyTrackId = options.melodyTrackId ?? getDefaultMelodyTrackId(song);
  const rhythmTrackIds = options.rhythmTrackIds ?? [...getDefaultRhythmTrackIds(song)];
  const melody = analyzeMelody(song, { trackId: melodyTrackId });
  const rhythm = analyzeRhythm(song, { trackIds: rhythmTrackIds });
  const motifs = analyzeMotifs(song, { trackId: melodyTrackId, noteLength: 4, maxMotifs: 3 });
  const keyAnalysis = options.keyAnalysis ?? analyzeKeyScale(song);
  const topKey = keyAnalysis.candidates?.[0] ?? null;
  const range = melody.range ?? null;
  const offBeatTotal = (rhythm.beatPosition?.onBeat ?? 0) + (rhythm.beatPosition?.offBeat ?? 0);
  const offBeatRatio = offBeatTotal > 0 ? (rhythm.beatPosition.offBeat ?? 0) / offBeatTotal : 0;
  const motifCount = motifs.motifs?.length ?? 0;

  const rangeValue = rangeLabel(range?.semitones);
  const movementValue = movementLabel(melody.leap?.averageSemitones);
  const rhythmValue = rhythmLabel(offBeatRatio, rhythm.onsetCount);
  const repetitionValue = repetitionLabel(motifCount, melody.noteCount);

  const metrics = [
    metric({
      id: 'key',
      label: 'Key',
      value: topKey?.value ?? '判定しにくい',
      detail: topKey ? 'いちばん近い候補' : '音数が少ない場合は無理に決めません',
      meaning: topKey
        ? '今の音の集まりに最も近い調性候補です。正解の断定ではなく、他の分析を見るための仮の基準にできます。'
        : '材料が少ないため、調性を無理に固定しない方が自然な状態です。',
      actions: topKey
        ? ['このKeyを仮の基準にしてMelodyやChordとの関係を見る', '必要なら詳細モードで第2候補と聴き比べる']
        : ['音を増やしてからもう一度見る', 'Keyを決めずに他の特徴だけ確認する'],
    }),
    metric({
      id: 'range',
      label: '音域',
      value: rangeValue,
      detail: range ? `${formatMidiPitch(range.low)}〜${formatMidiPitch(range.high)} · ${range.semitones}半音` : 'Melody候補を確認してください',
      meaning: !range
        ? '主旋律として読む材料がまだ少ない状態です。'
        : rangeValue === 'せまめ'
          ? '近い高さに音が集まり、会話的・反復的な輪郭を作りやすい特徴です。'
          : rangeValue === '広め'
            ? '低い音と高い音の落差があり、山場やコントラストを作りやすい特徴です。'
            : '極端に狭くも広くもなく、Sectionごとの変化を後から付けやすい範囲です。',
      actions: !range ? ['主旋律に近いTrackを確認する']
        : rangeValue === 'せまめ' ? ['Chorusだけ少し高い音域へ広げる案を試す', 'この狭さを特徴として維持する']
          : rangeValue === '広め' ? ['大きな音域差を山場だけに残す案と比較する', '広いまま活かしてSection差を確認する']
            : ['この音域を基準案として保存する'],
    }),
    metric({
      id: 'movement',
      label: '音の動き',
      value: movementValue,
      detail: melody.noteCount ? `平均 ${melody.leap.averageSemitones}半音 / 最大 ${melody.leap.maxSemitones}半音` : 'Melody候補を確認してください',
      meaning: !melody.noteCount
        ? '主旋律として読むNoteをまだ十分に検出できていません。'
        : movementValue === 'なめらか'
          ? '隣接する音への移動が中心で、流れを追いやすい輪郭です。'
          : movementValue === 'ジャンプが多め'
            ? '跳躍が輪郭のアクセントになっている特徴です。狙った場所だけに残す選択もできます。'
            : '隣接進行と跳躍が混ざり、滑らかさと輪郭の両方を持つ特徴です。',
      actions: !melody.noteCount ? ['主旋律に近いTrackを1つ選ぶ']
        : movementValue === 'ジャンプが多め' ? ['大きく跳ぶ箇所を1つ選び、なめらかな別案と比較する', '跳躍をフックとしてそのまま残す']
          : ['山場だけ跳躍を増やす案を試す', '今の動きを基準案として保存する'],
    }),
    metric({
      id: 'rhythm',
      label: 'リズム',
      value: rhythmValue,
      detail: rhythm.onsetCount ? `拍頭以外 ${Math.round(offBeatRatio * 100)}%` : '発音を検出できませんでした',
      meaning: !rhythm.onsetCount
        ? '発音位置の特徴を判断できる材料がまだ少ない状態です。'
        : rhythmValue === '拍頭中心'
          ? '拍の基準が見えやすく、安定したタイミング感を持つ特徴です。'
          : rhythmValue === '拍頭以外が多め'
            ? '拍の外側に発音が多く、前へ引っ張る感じや細かな動きを作りやすい特徴です。'
            : '拍頭と拍頭以外が混ざり、基準と変化の両方があります。',
      actions: !rhythm.onsetCount ? ['Rhythm対象Trackを確認する']
        : rhythmValue === '拍頭中心' ? ['1か所だけ拍頭の前後へずらす案を比較する', 'この安定感を維持する']
          : rhythmValue === '拍頭以外が多め' ? ['1小節だけ拍頭を強めた案と比較する', '細かい動きを特徴として維持する']
            : ['このバランスを基準案として保存する'],
    }),
    metric({
      id: 'repetition',
      label: '反復',
      value: repetitionValue,
      detail: motifCount ? `${motifCount}個の反復パターン候補` : '4音のまとまりを比較しています',
      meaning: motifCount
        ? '似た短い形が繰り返され、モチーフとして覚えやすいまとまりが見えています。'
        : melody.noteCount < 8
          ? 'Note数が少なく、反復の有無をまだ決めつけない方がよい状態です。'
          : '同じ4音形の反復が少なく、変化の多いフレーズとして読めます。',
      actions: motifCount
        ? ['この反復を別Sectionでも使う案を試す', '反復回数を減らした別案と比較する']
        : melody.noteCount >= 8
          ? ['気に入った2〜4音の形を1回だけ再利用して比較する', '反復を増やさず変化の多さを活かす']
          : ['Noteを増やしてから反復を再確認する'],
    }),
  ];

  const nextActions = dedupe(metrics.flatMap((item) => item.actions)).slice(0, 3);
  const observations = metrics.map((item) => `${item.label}: ${item.meaning}`);

  const referenceInsights = [
    referenceInsight('range-shape', '音域の使い方', rangeValue, '参考曲と比べる時は具体的な音程ではなく「Sectionで音域が広がるか」を見る'),
    referenceInsight('movement-shape', '旋律の動き', movementValue, '具体的なNote列ではなく「なめらか / 跳躍が多い」の傾向として自分の曲で試す'),
    referenceInsight('rhythm-shape', '発音位置', rhythmValue, '具体的なリズムをコピーせず「拍頭中心 / 拍外が多い」の比率感として試す'),
    referenceInsight('repetition-shape', '反復の使い方', repetitionValue, '元フレーズをコピーせず「短い形を反復する / 変化を増やす」という方法だけ借りる'),
  ];

  return Object.freeze({
    mode: 'beginner',
    melodyTrackId: melodyTrackId ?? null,
    rhythmTrackIds: Object.freeze([...rhythmTrackIds]),
    metrics: freezeList(metrics),
    observations: Object.freeze(observations),
    nextActions: Object.freeze(nextActions.length ? nextActions : ['気になったMetricを1つ選び、元案を残したまま別案を試す']),
    referenceInsights: freezeList(referenceInsights),
    // Backward-compatible aliases. The wording is deliberately neutral rather than grading the music.
    positives: Object.freeze(observations.slice(0, 3)),
    improvements: Object.freeze(['良し悪しではなく、気になった特徴だけ別案で比較できます。']),
    evidence: Object.freeze({
      melodyNoteCount: melody.noteCount ?? 0,
      rhythmOnsetCount: rhythm.onsetCount ?? 0,
      motifCount,
      offBeatRatio: Number(offBeatRatio.toFixed(3)),
    }),
  });
}
