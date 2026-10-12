# ARCHITECTURE.md

## 基本構造

```text
File Input
  ↓
src/midi/ Parser Adapter
  ↓
Normalized Song / Note
  ↓
Analysis Engines
  ├─ Key
  ├─ Chord
  ├─ Melody
  ├─ Bass
  └─ Rhythm
  ↓
Analysis Result Layer
  ↓
UI
```

## 原則
- Parserライブラリは `src/midi/` の内部だけで使用する
- Analysis Engineは外部ライブラリ形式に直接依存しない
- Noteは分析エンジンの唯一の音符入力
- Songは分析によって変更しない
- 分析結果はSongの外に持つ
- 分離結果も元Noteを書き換えず別Layerに持つ
- 将来連携はAdapter経由にする

## Module

### core
共通型、時間計算、Pitch Class等。

### midi
Standard MIDI Fileの読み取りと正規化。

### analysis
理論分析。Parser実装を知らない。

### separation
v0.2以降。MIDI内パート分離。

### piano-roll
読み取り専用表示。

### playback
最小Web Audio再生。

### storage
IndexedDB。保存選択と削除。

### ui
Android向け画面。

### adapters
RipX / Demo Composer等との境界。

## MIDI Parser候補
`midi-file` を第一候補とするが、依存を `src/midi/` に隔離する。
採用は実装開始時に最終確認する。

方針:
- 読み取り用途のみ
- CDNに依存しない
- bundleへ同梱
- Analysis側へ生データ形式を漏らさない
