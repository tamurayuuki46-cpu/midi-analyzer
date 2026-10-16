# ARCHITECTURE.md

## 基本構造

```text
File Input
  ↓
src/midi/ Parser Adapter
  ↓
Normalized Song / Note
  ├─→ src/storage/ IndexedDB v3
  ├─→ src/piano-roll/ Read-only visualization
  ├─→ src/playback/ Web Audio preview
  ├─→ src/recording/ Part Recorder
  ↓
Analysis Engines
  ├─ key
  ├─ chord / degree
  ├─ basic melody / bass / rhythm
  ├─ motif / structure / modulation / harmony detail
  ├─ compare / personal trend
  ├─ deep counter / bass / drum / part candidates
  ├─ visualization
  └─ higher-level metrics
  ↓
Analysis Bundle
  ├─→ Explainability
  ├─→ JSON / CSV / Markdown / Text Export
  └─→ Demo Composer Adapter
  ↓
Tabbed UI
```

PC側:
```text
RipX / MIDI export
  ↓
bridge/server.mjs
  ↓ same LAN
Android Browser → MIDI Download → MIDI Analyzer Import
```

## 原則
- Parserライブラリは`src/midi/`内部だけで使用する
- Analysis Engineはraw MIDI library形式へ依存しない
- Normalized Song / Noteを解析の正本にする
- Analysis / Visualization / Export / Explainability / MetricsはSongを変更しない
- 分析結果はSongの外に持つ
- Candidateを自動確定しない
- 外部連携はAdapter境界に閉じ込める
- 外部AI / Cloudへ自動送信しない

## Parser Boundary
Browser File → `src/midi/parseMidiFile.js` → `midi-file` raw event → `normalizeMidi.js` → `{ song, warnings }`

`midi-file` raw event modelは`src/midi/`外へ出さない。

## Modules

### src/midi
SMF読み取りとNormalized Song化。

### src/analysis/key / chord / basic
Key / Chord / Degree / Melody / Bass / Rhythmの基礎解析。

### src/analysis/motif / structure / harmony
Motif、固定4小節Section、区間Key、転調、Chord Detail。

### src/analysis/compare / deep / visualization
2曲比較、Personal Trend、Counter/Bass/Drum/Part候補、曲全体可視化。

### src/analysis/summary
`buildAnalysisBundle(song)`。
既存Analyzer結果をExport / Explainability / Metrics用の共通Read Modelへまとめる。
Analyzer順位を変更しない。

### src/analysis/metrics
v0.9 Higher-level candidate Metrics。
0〜100 Score + Evidence。品質評価ではない。

### src/analysis/explanation
v0.8 local Explainability。
既存候補を自然言語化し、必要に応じて外部AI用Promptを生成する。
Network通信は責務外。

### src/export
- Analysis JSON / CSV / Markdown / Text
- Demo Composer Schema 3 Adapter

Demo ComposerのSchemaをMIDI Analyzer側へコピーして独自改変せず、変換Adapterで吸収する。

### src/recording
選択Part SongをWeb Audioで鳴らし、MediaRecorderへ録音する。
PlaybackとはControllerを分離する。

### src/storage
IndexedDB v3。
- savedMidis
- savedClips
- savedTakes

Migrationは非破壊。

### src/piano-roll / playback
Normalized SongのRead-only表示 / 簡易再生。

### src/ui
Analyzer / Archiveの2画面（`appViews`）。Analyzerは12カテゴリTab、ArchiveはClip Library / Key変更 / 保存済みMIDI等。UI stateはSongへ書き戻さない。
Export / AI / Metricsも表示・書き出しLayerとして扱う。

### bridge
PC側Node Prototype。指定した1個のMIDIだけをLAN配信する。
MIDI Analyzer本体とは独立プロセス。

## Dependency方向
原則:

`midi → normalized song → analysis → summary → metrics/explanation/export → UI`

逆方向依存を作らない。
Export / UIからAnalyzer内部状態を変更しない。

## Build Tool
ViteをBuild / Dev Server用途だけに使用。React / TypeScript等のFrameworkは導入しない。
