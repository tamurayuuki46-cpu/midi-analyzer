# CLIP_LIBRARY_SPEC.md

## Version
v0.6-dev

## 目的
読み込んだMIDIから、作曲で再利用・比較しやすい4小節単位の素材を端末内Libraryへ保存する。
元MIDIやNormalized Songは変更しない。

## Clip Type
- Chord
- Melody
- Bass
- Drum
- Motif

## 4小節切り出し
- `buildAnalysisWindows()`から小節境界を取得する
- 4小節以上の曲では、連続するすべての4小節Rangeを選択可能にする
  - 例: 8小節 → 1–4 / 2–5 / 3–6 / 4–7 / 5–8
- 4小節未満は曲全体をpartial Clipとして扱う
- Range境界にまたがるNoteはClip境界で切る
- Clip内Noteの`startTick`はRange先頭を0として相対化する
- 元SongのNoteは変更しない

## Track選択
初期ScopeではroleHint /既存heuristicに基づく既定Trackを使う。

- Chord: Chord Analyzer既定Track群
- Melody: Melody既定Track
- Bass: Bass既定Track
- Drum: Drum Track、なければRhythm既定Track
- Motif: Melody既定Track

手動Track選択は将来拡張。

## 自動Metadata
Clip保存時に以下を自動保存する。

- source fileName / origin
- startBar / endBar / tick Range
- PPQ
- type
- selected trackIds
- clip notes
- BPM
- Key第1候補
- Top 1 Chord progression
- Motif typeではMotif候補

Key / ChordはAnalyzer候補であり確定情報ではない。

## ユーザーTag
任意で以下を保存できる。

- name
- Genre
- Mood
- custom tags（カンマ区切り、重複除去、最大20件）

## Chord進行DB
すべてのClipへRange内Top 1 Chord progressionをcontextとして保存する。
Chord Clipではこの進行を主なLibrary内容として表示・検索する。

例:
`C → G → Am → F`

## 検索
空白区切りの複数tokenをAND検索する。
検索対象:

- Clip名
- type
- source fileName
- Genre
- Mood
- BPM
- Key
- custom tags
- Chord名

## Storage
IndexedDB Database `midi-analyzer` version 2。
`savedClips` Object Storeを追加する。

Clip record:

```text
clipSchemaVersion: 1
id
savedAt
type
name
source
  fileName
  origin
range
  startBar
  endBar
  startTick
  endTick
  barCount
  complete
  lengthTicks
ppq
trackIds
notes
chordProgression
motifs
tags
  genre
  mood
  bpm
  key
  custom[]
```

## Migration
v1の`savedMidis` Storeを削除・上書きしない。
v1→v2 Upgradeでは`savedClips`だけを追加し、既存MIDI recordをそのまま維持する。

## UI
Library Tabを以下に分ける。

1. 保存済みMIDI
2. Clip Library

Clip Library内:
- type select
- 4小節Range select
- optional name / Genre / Mood / custom tags
- Save button
- search input
- Clip card list
- Delete button

Androidでは1column優先。削除は確認dialog後に実行する。

## 非対応
- ClipからMIDI binaryを書き出す
- Clip編集
- Note移動 / Quantize
- Cloud同期
- Demo Composer送信
- Track手動対応付け
