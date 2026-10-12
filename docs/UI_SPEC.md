# UI_SPEC.md

## 対象
Android Chrome / スマートフォン。

## 画面フロー

Import
↓
Track一覧
↓
分析
  ├─ 概要
  ├─ コード
  ├─ メロディ
  ├─ ベース
  └─ リズム

## v0.1主要操作
- Import
- 保存する / しない
- 保存済みMIDI削除
- Track選択
- 分析対象Track選択
- Candidate選択
- Piano Roll表示
- Play / Stop

## v0.1では置かない
- 一般Export
- Demo Composerへ送る
- Loop
- Tempo変更
- MIDI編集
- 音色選択

## Android原則
- 片手操作
- タップ領域を広く
- 小さすぎる文字を避ける
- 長押し依存を避ける
- ピンチ必須にしない
- Piano RollのZoomは +/- ボタンも用意
- 横スクロールはPiano Roll中心
- 分析結果は縦スクロール中心
- 主要操作は画面下部に寄せる
