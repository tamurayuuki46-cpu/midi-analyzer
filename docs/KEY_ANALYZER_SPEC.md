# KEY_ANALYZER_SPEC.md

## Version
v0.1-dev

## 目的
MIDIの音使いからKey / Scaleの候補を3つ提示する。
確定判定や良し悪しの評価は行わない。

## 入力
Normalized `Song.notes`。
`midi-file` raw eventには依存しない。

## 対象Note
- `channel === 9`（MIDI Channel 10 / Drums）は除外
- durationTick <= 0 は除外
- velocity <= 0 は除外

## Pitch Class分布
各Noteを次で重み付けする。

`durationTick × velocity`

12 Pitch Classへ集約する。

## 候補
- 12 root × major/minor = 24候補
- major / minorの固定Key profileとPitch Class分布を比較
- 比較はCosine Similarity
- 上位3候補を表示

## confidence
0〜1の一致度。
確率ではない。
UIでは「一致度 xx%」として表示し、確率ではないことを補足する。

## selected
解析直後は必ず `null`。
ユーザーがUIで候補を選んだ場合だけ選択状態を持つ。
解析アルゴリズムが自動で確定しない。

## 上位候補が近い場合
第1候補と第2候補のscore差が第1候補の10%以内なら、始まり / 終わり付近の三和音候補を補助ヒントとして調べる。

- window: 2 quarter-note lengths（`ppq × 2`）
- major / minorのroot + 3rd + 5thがすべて存在する場合のみヒント候補
- ヒントは順位やconfidenceを変更しない
- Chord Analyzerの正式結果とは別物

この10%は暫定値で、実MIDIテスト後に調整する。

## 空データ
Drums以外のNoteが存在しない場合は候補を出さず、理由を短く表示する。

## v0.1で扱わないScale
- Harmonic Minor
- Melodic Minor
- Dorian
- Mixolydian
- Pentatonic

必要性を実制作テストで確認してから拡張する。
