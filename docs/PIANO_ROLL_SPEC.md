# PIANO_ROLL_SPEC.md

## Version
v0.1-dev

## 目的
MIDIを編集するためではなく、選択TrackのNote配置をスマホ上で確認する。

## 入力
Normalized `Song` / `Track` / `Note` のみを使用する。
`midi-file` raw eventには依存しない。

## 表示
- 1 Trackずつ表示
- 横軸: tick → PPQ基準の時間位置
- 縦軸: MIDI Pitch
- Note: startTick / durationTick / pitchから矩形表示
- 小節線: 強い線 + 小節番号
- 拍線: 弱い線
- Pitch label: C音を中心に表示

## Track選択
- Noteを持つTrackだけselectへ表示
- 初期選択は非Drum Trackを優先
- Track切替時はスクロール位置を先頭へ戻す

## Zoom
v0.1は4段階。
- 24 px / 4分音符
- 36 px / 4分音符
- 52 px / 4分音符
- 72 px / 4分音符

ピンチ操作は必須にせず `− / ＋` ボタンで操作する。

## Scroll
- 横: 時間
- 縦: Pitch
- 最大表示高を設け、ページ全体の縦長化を防ぐ
- Pitch label列は横スクロール時に左へ残す

## 拍子
小節 / 拍GridはtimeSignaturesをtick順に使用する。
拍子変更tickを新しい小節境界として扱う。
6/8等ではGridの拍を分母単位で描画する。
`musicalBeat`（例: 6/8の付点4分）は分析側で別概念として扱い、Piano Roll Zoom表記は「px/4分」とする。

## 非機能
- 元Song / Noteを変更しない
- Note編集を追加しない
- 選択Trackだけを描画してスマホ負荷を抑える
- timeline SVG幅は極端なMIDIでの負荷抑制のため上限を持つ

## v0.1でしない
- Note drag
- Resize
- Velocity編集
- Quantize
- Multi-track overlay
- Chord tone coloring
- Playback cursor同期
- Pinch必須操作
