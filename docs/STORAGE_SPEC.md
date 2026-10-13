# STORAGE_SPEC.md

## Version
v0.12-dev

更新日: 2026-10-13

## 目的

MIDI Analyzerの「素材を集める / 曲を理解する」責務に必要なデータをAndroid端末内へ保持する。
クラウドや外部サービスへ自動送信しない。

## 基本ルール

- MIDI Importの「この端末に保存する」は初期OFF
- 保存ONの場合のみ元MIDI + Normalized Songを`savedMidis`へ保存
- 素材ClipはLibraryで明示保存した場合のみ`savedClips`へ保存
- Stemはユーザーが明示Importした場合のみ別IndexedDBへ保存
- 旧Part Recorder Takeは互換性のため`savedTakes`へ保持するが、新規主導線からは外す
- 一方のStore削除で他Storeを連鎖削除しない
- 保存データを外部APIや他アプリへ自動送信しない

## IndexedDB: MIDI / Clip / legacy Take

Database:
`midi-analyzer`

Version:
`3`

### savedMidis

v0.1から継続する元MIDI保存Store。

```text
storageSchemaVersion: 1
id
savedAt
source
  fileName
  origin
  size
  type
  lastModified
midiBytes
song
warnings
```

### savedClips

v0.6で追加。v0.12-devから新規Clipは`clipSchemaVersion: 2`。

Schema正本: `docs/CLIP_LIBRARY_SPEC.md`

v1 Clipはそのまま保持する。Provenanceを追加するためのDB Version変更は行わない。

### savedTakes — legacy compatibility

v0.7で追加したPart Recorder Take Store。

Part Recorderはv0.12-devで主UIから退役したが、保存済みTakeを失わないためStoreは削除しない。

```text
takeSchemaVersion: 1
id
savedAt
name
partType
trackIds[]
source
mimeType
durationSeconds
eventCount
audioBytes
```

新しい主要WorkflowではTake作成を推奨しない。
将来Store削除を行う場合は、明示Export / Migrationを用意してから別Versionで実施する。

## Stem Storage

Database:
`midi-analyzer-stems`

Version:
`1`

Store:
`stems`

Audio BlobはSongProject JSONへ埋め込まずIndexedDBに保持する。

新規Stem metadata:

```text
id
name
type
sourceFileName
mimeType
size
duration
conversionStatus
analysisStatus
source
provenance
  type
  sourceTitle
  sourceProjectId
  importedFrom
createdAt
updatedAt
blob
```

`provenance.type`はMoises / RipX / self / reference / other / unknown等。
既存Stem recordにprovenanceが無い場合も読み込める。旧`source`から推定できる場合だけ補完する。

MoisesをStem分離の主入口とし、AnalyzerはImport / 保存 / Solo / Mute / Basic Pitch / 分析を担当する。

## Migration

### MIDI DB v1/v2 → v3

既存のMigrationを維持する。

1. `savedMidis`を保持
2. `savedClips`を保持
3. 既存recordを削除・変換しない
4. `savedTakes`だけ追加

### v0.12 provenance

Clip / StemへのProvenance追加はoptional fieldのためDB Versionを上げない。

- 既存Clip v1を上書きしない
- 既存Stemを上書きしない
- 新規Clip / StemからProvenanceを保存
- 読み取り時はfield欠落を許容

## 削除

- MIDI削除 → `savedMidis`のみ
- Clip削除 → `savedClips`のみ
- Take削除 → `savedTakes`のみ
- Stem削除機能を追加する場合もStem Storeのみ

## エラー方針

保存失敗で解析成功結果を破棄しない。
MIDI / Clip / Stem / legacy Takeの保存失敗は別々に扱う。

## Testing

- v1→v3 / v2→v3 Migration
- 既存MIDI / Clip保持
- MIDI CRUD
- Clip CRUD
- legacy Take CRUD
- Clip v1互換
- Clip v2 Provenance
- Stem Provenance normalization
- Legacy Stem provenance fallback
