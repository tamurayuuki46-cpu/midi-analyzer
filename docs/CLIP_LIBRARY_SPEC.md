# CLIP_LIBRARY_SPEC.md

## Version
v0.12-dev

更新日: 2026-10-13

## 目的

読み込んだMIDIから、作曲で再利用・比較しやすい4小節単位の素材を端末内Libraryへ保存する。
MIDI Analyzerの「素材を集める」責務として、素材の音楽内容だけでなく**出自（provenance）**も追跡する。
元MIDIやNormalized Songは変更しない。

## Clip Type

- Chord
- Melody
- Bass
- Drum
- Motif

## 4小節切り出し

- `buildAnalysisWindows()`から小節境界を取得
- 4小節以上では連続する全4小節Rangeを選択可能
- 4小節未満は曲全体をpartial Clipとして扱う
- Range境界にまたがるNoteはClip境界で切る
- Clip内`startTick`はRange先頭を0として相対化
- 元SongのNoteは変更しない

## 自動Metadata

- source fileName / origin
- startBar / endBar / tick Range
- PPQ
- type
- trackIds
- notes
- BPM
- Key第1候補
- Top 1 Chord progression
- Motif候補（Motif Clip）

Key / ChordはAnalyzer候補であり確定情報ではない。

## Material Provenance

v0.12-devからClip Schema 2として追加する。

`provenance.type`:

- `self` — 自作
- `reference` — 参考曲由来
- `moises-stem` — Moises Stem由来
- `audio-to-midi` — Audio→MIDI由来
- `ripx` — RipX由来
- `book` — 書籍由来
- `plugin` — Plugin由来
- `manual` — 手入力
- `other`
- `unknown`

Provenance:

```text
provenance
  type
  sourceTitle
  sourceProjectId
  usedInProjectIds[]
  importedFrom
  createdBy
  recordedAt
```

`sourceTitle`は元曲・素材名。
`sourceProjectId`は自作素材の場合の元Project。
`usedInProjectIds`は将来、どの曲で再利用したかを追跡するための配列。

Moises / RipX / Audio→MIDIは`Song.source.origin`から自動推定できる場合は自動設定する。ユーザー指定を優先する。

## ユーザーTag

- name
- Genre
- Mood
- custom tags（重複除去、最大20件）

## 検索

空白区切りtokenのAND検索。

検索対象:
- Clip名
- type
- source fileName
- provenance type
- sourceTitle
- sourceProjectId
- usedInProjectIds
- Genre
- Mood
- BPM
- Key
- custom tags
- Chord名

## Storage

IndexedDB Database `midi-analyzer` の`savedClips` Storeを継続利用する。
DB VersionはProvenance追加だけでは上げない。

Clip Schema 2:

```text
clipSchemaVersion: 2
id
savedAt
type
name
source
  fileName
  origin
provenance
  type
  sourceTitle
  sourceProjectId
  usedInProjectIds[]
  importedFrom
  createdBy
  recordedAt
range
ppq
trackIds
notes
chordProgression
motifs
tags
```

## v1互換

既存`clipSchemaVersion: 1` recordは自動削除・自動上書きしない。
Provenanceが無いv1 Clipも一覧・検索・削除できる。
UIでは出自未設定として扱う。

保存済みv1 Clipを強制Migrationしない。新規保存だけSchema 2とする。

## UI

Library Tab:
1. 保存済みMIDI
2. 素材Clip Library

素材保存時:
- type
- Range
- 出自
- 元曲 / 素材名
- 元Project ID
- name / Genre / Mood / custom tag

を指定できる。

Androidは1column優先。削除前に確認する。

## 非対応

- Clip内の本格MIDI編集
- Cloud同期
- 参考曲Clipを自動的に自作Compositionへ変換

素材の本格的な作曲利用はDemo Composerへ渡す。
