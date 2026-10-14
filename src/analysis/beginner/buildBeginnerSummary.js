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
  if (offBeatRatio <= 0.15) return 'まっすぐ';
  if (offBeatRatio <= 0.45) return 'ほどよく変化';
  return '細かく動く';
}

function repetitionLabel(motifCount, melodyNoteCount) {
  if (motifCount > 0) return 'まとまりあり';
  if (melodyNoteCount < 8) return 'まだ判定しにくい';
  return '反復少なめ';
}

function dedupe(items) {
  return [...new Set(items.filter(Boolean))];
}

function freezeList(items) {
  return Object.freeze(items.map((item) => Object.freeze(item)));
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

  const metrics = [
    {
      id: 'key',
      label: 'Key',
      value: topKey?.value ?? '判定しにくい',
      detail: topKey ? 'いちばん近い候補' : '音数が少ない場合は無理に決めません',
    },
    {
      id: 'range',
      label: '音域',
      value: rangeLabel(range?.semitones),
      detail: range ? `${formatMidiPitch(range.low)}〜${formatMidiPitch(range.high)} · ${range.semitones}半音` : 'Melody候補を確認してください',
    },
    {
      id: 'movement',
      label: '音の動き',
      value: movementLabel(melody.leap?.averageSemitones),
      detail: melody.noteCount ? `平均 ${melody.leap.averageSemitones}半音 / 最大 ${melody.leap.maxSemitones}半音` : 'Melody候補を確認してください',
    },
    {
      id: 'rhythm',
      label: 'リズム',
      value: rhythmLabel(offBeatRatio, rhythm.onsetCount),
      detail: rhythm.onsetCount ? `拍頭以外 ${Math.round(offBeatRatio * 100)}%` : '発音を検出できませんでした',
    },
    {
      id: 'repetition',
      label: '反復',
      value: repetitionLabel(motifCount, melody.noteCount),
      detail: motifCount ? `${motifCount}個の反復パターン候補` : '4音のまとまりを比較しています',
    },
  ];

  const positives = [];
  const improvements = [];
  const actions = [];

  if (topKey) positives.push(`Keyは「${topKey.value}」を最初の候補として見始められます。`);
  if (range && range.semitones <= 16) positives.push('主旋律の音域がまとまっていて、全体像を追いやすいです。');
  if (melody.noteCount >= 2 && melody.leap.averageSemitones <= 5) positives.push('主旋律の音のつながりが極端に飛びすぎていません。');
  if (motifCount > 0) positives.push('同じ形の反復が見つかり、フレーズのまとまりを確認できます。');
  if (rhythm.onsetCount >= 4 && offBeatRatio > 0.15 && offBeatRatio <= 0.45) positives.push('拍頭と拍頭以外が混ざり、リズムに適度な変化があります。');

  if (!melody.noteCount) {
    improvements.push('Melody候補のTrackを詳細モードで確認すると、主旋律の分析が分かりやすくなります。');
    actions.push('詳細モードのMelodyで、主旋律に近いTrackを1つ選ぶ');
  } else {
    if (range && range.semitones > 18) {
      improvements.push('主旋律の音域が広めです。歌いやすさやまとまりを確認する余地があります。');
      actions.push('いちばん高い音か低い音を少し内側へ寄せて試聴する');
    } else if (range && range.semitones < 5 && melody.noteCount >= 8) {
      improvements.push('主旋律の音域がかなり狭めです。山場だけ少し広げると変化を作れます。');
      actions.push('山場だけ3〜5半音ほど高い音を試して、元案と比較する');
    }

    if (melody.leap?.averageSemitones > 5 || melody.leap?.maxSemitones > 12) {
      improvements.push('大きな音程ジャンプが多めです。狙った場所だけに残すと輪郭を整理できます。');
      actions.push('大きく跳ぶ箇所を1つ選び、中間の音を使う案と比較する');
    }

    if (!motifCount && melody.noteCount >= 8) {
      improvements.push('同じ4音形の反復は少なめです。短い形を再利用すると覚えやすいまとまりを作れます。');
      actions.push('気に入った2〜4音の形を、別の場所でもう1回だけ使ってみる');
    }
  }

  if (rhythm.onsetCount >= 8 && offBeatRatio > 0.65) {
    improvements.push('拍頭以外の発音が多めです。数か所だけ拍頭をはっきりさせると基準を作れます。');
    actions.push('1小節だけ拍頭に音を置く案を作り、元のリズムと比較する');
  } else if (rhythm.onsetCount >= 8 && offBeatRatio < 0.08) {
    improvements.push('拍頭中心のリズムです。変化が欲しい場合は1か所だけ食うタイミングを試せます。');
    actions.push('1か所だけ拍頭より少し前か後ろに動かして比較する');
  }

  const safePositives = dedupe(positives);
  const safeImprovements = dedupe(improvements);
  const safeActions = dedupe(actions).slice(0, 3);

  if (!safePositives.length) safePositives.push('MIDIを読み込み、主な特徴を一画面で確認できる状態です。');
  if (!safeImprovements.length) safeImprovements.push('大きく気になる偏りは見つかりませんでした。必要な所だけ詳細モードで確認してください。');
  if (!safeActions.length) {
    safeActions.push('まず簡易再生で全体を聴き、気になった項目を1つだけ選ぶ');
    safeActions.push('必要なら詳細モードでKey・Melody・Rhythmの順に確認する');
  }

  return Object.freeze({
    mode: 'beginner',
    melodyTrackId: melodyTrackId ?? null,
    rhythmTrackIds: Object.freeze([...rhythmTrackIds]),
    metrics: freezeList(metrics),
    positives: Object.freeze(safePositives),
    improvements: Object.freeze(safeImprovements),
    nextActions: Object.freeze(safeActions),
    evidence: Object.freeze({
      melodyNoteCount: melody.noteCount ?? 0,
      rhythmOnsetCount: rhythm.onsetCount ?? 0,
      motifCount,
      offBeatRatio: Number(offBeatRatio.toFixed(3)),
    }),
  });
}
