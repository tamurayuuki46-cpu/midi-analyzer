# ARCHITECTURE.md

## 基本構造

```text
File Input
  ↓
src/midi/ Parser Adapter
  ↓
Normalized Song / Note
  ├─→ src/storage/ IndexedDB
  ├─→ src/piano-roll/ Read-only visualization
  ↓
Analysis Engines
  ├─ Key ← implemented
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
- Songは分析・表示によって変更しない
- 分析結果はSongの外に持つ
- `selected` は人が選択したときだけ設定する
- 分離結果も元Noteを書き換えず別Layerに持つ
- 将来連携はAdapter経由にする
- Piano RollはNormalized Songだけを読み、MIDI編集責任を持たない

## v0.1 Parser Boundary

```text
Browser File
  ↓ arrayBuffer()
src/midi/parseMidiFile.js
  ↓ midi-file raw event model
src/midi/normalizeMidi.js
  ↓
{ song, warnings }
```

`midi-file` のraw event modelは `src/midi/` の外へ出さない。

## Module

### core
共通型、時間計算、Pitch Class等。

### midi
Standard MIDI Fileの読み取りと正規化。

実装済み:
- `parseMidiFile.js`: File → parser → normalizer
- `normalizeMidi.js`: raw MIDI event → Song / Track / Note
- `roleHint.js`: Track名とChannelからの補助hint

### analysis/key
Normalized SongからKey / Scale候補を作る。

実装済み:
- `analyzeKeyScale.js`: Pitch Class重み / 24 Key profile比較 / Top 3
- Drum Note除外
- close候補時のedge harmony補助hint
- Parser implementationへ依存しない

### analysis/chord / melody / bass / rhythm
未実装。Key Analyzerと同様にNormalized SongまたはAnalysis Resultだけへ依存させる。

### separation
v0.2以降。MIDI内パート分離。

### piano-roll
読み取り専用表示。

実装済み:
- `model.js`: Track Note抽出、Pitch Range、Timeline marker、Note名
- `renderPianoRoll.js`: Track選択・Zoom・SVG表示
- `pianoRoll.css`: Android向けスクロール / 操作UI
- 1度に選択Trackだけを描画し、元Song / Noteは変更しない

### playback
最小Web Audio再生。

### storage
IndexedDB。保存選択と削除。

### ui
Android向け画面。分析結果の候補選択はここで行い、Analyzer自身は確定しない。

### adapters
RipX / Demo Composer等との境界。

## MIDI Parser

v0.1では `midi-file@1.2.4` を採用する。
Analysis Engineから直接importしない。

## Build Tool

`Vite` をBuild / Dev Server用途だけに使用する。
React / TypeScript等のFramework導入を意味しない。
