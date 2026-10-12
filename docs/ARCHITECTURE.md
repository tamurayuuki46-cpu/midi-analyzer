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
  ├─ Chord + Degree ← implemented
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
- 将来連携はAdapter経由にする
- Piano RollはNormalized Songだけを読み、MIDI編集責任を持たない

## Parser Boundary
Browser File → `src/midi/parseMidiFile.js` → `midi-file` raw event → `normalizeMidi.js` → `{ song, warnings }`

`midi-file` raw event modelは `src/midi/` 外へ出さない。

## Module

### core
共通型、時間計算、Pitch Class等。

### midi
Standard MIDI File読み取りと正規化。

### analysis/key
Normalized SongからKey / Scale候補を作る。Drum除外、24 profile比較、Top 3。

### analysis/chord
Normalized Songと選択Track IDsからChord候補を作る。
- `analyzeChords.js`: analysisGrid / overlap weight / Chord scoring / stabilization / Degree
- `index.js`: public exports
- Parser実装へ依存しない
- Key Analyzerの選択状態はUIからDegree計算用に渡すだけで、Songを書き換えない

### analysis/melody / bass / rhythm
未実装。Normalized SongまたはAnalysis Resultだけへ依存させる。

### piano-roll
読み取り専用。1度に選択Trackだけ描画し、元Song / Noteは変更しない。

### playback
最小Web Audio再生。未実装。

### storage
IndexedDB。保存選択と削除。

### ui
Android向け画面。Key / Chord候補の選択状態はUI stateで持つ。

### adapters
RipX / Demo Composer等との境界。

## Build Tool
ViteをBuild / Dev Server用途だけに使用。React / TypeScript等のFrameworkは導入しない。
