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
  ├─→ src/playback/ Web Audio preview
  ↓
Analysis Engines
  ├─ Key ← implemented
  ├─ Chord + Degree ← implemented
  └─ Melody / Bass / Rhythm ← implemented
  ↓
Analysis Result Layer
  ↓
UI
```

## 原則
- Parserライブラリは `src/midi/` の内部だけで使用する
- Analysis Engineは外部ライブラリ形式に直接依存しない
- Noteは分析エンジンの唯一の音符入力
- Songは分析・表示・再生によって変更しない
- 分析結果はSongの外に持つ
- `selected` は人が選択したときだけ設定する
- 将来連携はAdapter経由にする
- Piano RollはNormalized Songだけを読み、MIDI編集責任を持たない
- PlaybackもNormalized Songだけを読み、元MIDI event modelへ依存しない

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

### analysis/basic
Normalized SongとChord ResultからMelody / Bass / Rhythmのv0.1特徴量を作る。
- Melody: 音域 / 跳躍 / 同音連打 / 密度 / Chord Tone
- Bass: 最低音移動 / Root・3rd・5th・Other / リズム型
- Rhythm: 拍位置 / シンコペーション候補 / 密度 / 16分Grid

### piano-roll
読み取り専用。1度に選択Trackだけ描画し、元Song / Noteは変更しない。

### playback
Normalized SongからTempo Mapを反映した再生scheduleを作り、Web Audioで簡易プレビューする。
- `buildPlaybackSchedule.js`: Tick→seconds / Tempo区間 / Note schedule
- `createPlaybackController.js`: lookahead scheduler / Play / Stop / AudioContext lifecycle
- 元音色再現は責務外

### storage
IndexedDB。保存選択と削除。

### ui
Android向け画面。Key / Chord候補の選択状態はUI stateで持つ。PlaybackはユーザーのPlay操作からAudioContextを開始する。

### adapters
RipX / Demo Composer等との境界。

## Build Tool
ViteをBuild / Dev Server用途だけに使用。React / TypeScript等のFrameworkは導入しない。
