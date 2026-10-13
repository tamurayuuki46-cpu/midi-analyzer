# STORAGE_SPEC.md

## Version
v0.7-dev

## 目的
MIDI Analyzerで読み込んだMIDI、ユーザーが明示保存した4小節Clip、分離録音TakeをAndroid端末内へ保持する。
クラウドや外部サービスへ自動送信しない。

## 基本ルール
- MIDI Import時の「この端末に保存する」は初期OFF
- 保存OFFの場合、元MIDI binary / SongをIndexedDBへ保存しない
- 保存ONの場合のみ元MIDI + Normalized Songを`savedMidis`へ保存する
- Clip保存はLibrary Tabでユーザーが`Clipを保存`を押した場合だけ行う
- Take保存はRecorder Tabでユーザーが録音した場合だけ行う
- 保存データをクラウド、外部API、他アプリへ自動送信しない
- 保存済みMIDI / Clip / Takeはそれぞれ一覧から削除できる
- 削除前にユーザー確認を行う

## IndexedDB
Database:
`midi-analyzer`

Version:
`3`

### Object Store: savedMidis
v0.1から継続する元MIDI保存Store。

Key:
`id`

Index:
`savedAt`

Record:

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

`midiBytes`は元MIDI ArrayBuffer。
`song`はNormalized Song。

### Object Store: savedClips
v0.6で追加したClip Library Store。

Key:
`id`

Indexes:
- `savedAt`
- `type`

Record Schemaは`docs/CLIP_LIBRARY_SPEC.md`を正本とする。

### Object Store: savedTakes
v0.7で追加する分離録音Take Store。

Key:
`id`

Indexes:
- `savedAt`
- `partType`

Record:

```text
takeSchemaVersion: 1
id
savedAt
name
partType
trackIds[]
source
  fileName
  origin
mimeType
durationSeconds
eventCount
audioBytes
```

`audioBytes`はMediaRecorderで得たBlobをArrayBufferへ変換したもの。

## v1 / v2 → v3 Migration
DB version 3へのUpgradeで以下を行う。

1. `savedMidis`が既に存在する場合はそのまま維持する
2. `savedClips`が既に存在する場合はそのまま維持する
3. 既存recordを削除・変換しない
4. 新しい`savedTakes` Storeだけを追加する
5. Storeが存在しない新規環境では必要なStoreを作成する

Migrationによって元MIDI / Clip dataを上書きしない。
`fake-indexeddb`でv1およびv2 DBを作成後、v3へUpgradeして既存recordが残ることを自動テストする。

## 保存OFF時
MIDI Importの保存OFFでは、元MIDI / Songを`savedMidis`へ永続化しない。

ClipはImport保存設定とは独立し、Library Tabで明示的に保存ボタンを押した場合だけ`savedClips`へ保存する。
TakeもImport保存設定とは独立し、Recorder Tabで録音した場合だけ`savedTakes`へ保存する。

## 削除
- MIDI削除 → `savedMidis`対象recordのみ削除
- Clip削除 → `savedClips`対象recordのみ削除
- Take削除 → `savedTakes`対象recordのみ削除
- 一方の削除で他Storeを連鎖削除しない

## エラー方針
IndexedDB保存に失敗してもMIDI Import成功結果は破棄しない。
MIDI保存失敗 / Clip保存失敗 / Take保存失敗は別に表示する。
録音失敗時も既存Analyzer結果を破棄しない。

## Testing
Node unit testでは`fake-indexeddb`を利用する。
確認対象:
- v1→v3 migration
- v2→v3 migration
- 既存`savedMidis` / `savedClips` record保持
- MIDI CRUD
- Clip CRUD
- Take CRUD
- savedAt降順一覧
