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

## MIDI Parser

v0.1では `midi-file@1.2.4` を採用する。

採用理由:
- Standard MIDI Fileのraw eventとdeltaTimeを直接扱える
- tick / PPQ中心の内部設計へ変換しやすい
- MIT License
- Parser依存を `src/midi/` に閉じ込められる

注意:
- package自体は成熟しているが更新頻度は高くない
- Analysis Engineから直接importしない
- 将来差し替える場合でもNormalized Song Schemaは維持する

## Build Tool

`Vite` をBuild / Dev Server用途だけに使用する。

目的:
- npm dependencyをAndroid Chrome向けにbundleする
- CDN依存を避ける
- plain HTML/CSS/JavaScript構成を維持する

React / TypeScript等のFramework導入を意味しない。
