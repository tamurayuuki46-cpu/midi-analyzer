# STORAGE_SPEC.md

## Version
v0.6-dev

## 目的
MIDI Analyzerで読み込んだMIDIと、ユーザーが明示保存した4小節ClipをAndroid端末内へ保持する。
クラウドや外部サービスへ自動送信しない。

## 基本ルール
- MIDI Import時の「この端末に保存する」は初期OFF
- 保存OFFの場合、元MIDI binary / SongをIndexedDBへ保存しない
- 保存ONの場合のみ元MIDI + Normalized Songを`savedMidis`へ保存する
- Clip保存はLibrary Tabでユーザーが`Clipを保存`を押した場合だけ行う
- 保存データをクラウド、外部API、他アプリへ自動送信しない
- 保存済みMIDI / Clipはそれぞれ一覧から削除できる
- 削除前にユーザー確認を行う

## IndexedDB
Database:
`midi-analyzer`

Version:
`2`

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
v0.6で追加するClip Library Store。

Key:
`id`

Indexes:
- `savedAt`
- `type`

Record Schemaは`docs/CLIP_LIBRARY_SPEC.md`を正本とする。

## v1 → v2 Migration
DB version 2へのUpgradeで以下を行う。

1. `savedMidis`が既に存在する場合はそのまま維持する
2. `savedMidis`の既存recordを削除・変換しない
3. 新しい`savedClips` Storeだけを追加する
4. `savedMidis`が存在しない新規環境では両Storeを作成する

Migrationによって元MIDI dataを上書きしない。
`fake-indexeddb`でv1 recordを作成後、v2へUpgradeして既存recordが残ることを自動テストする。

## 保存OFF時
MIDI Importの保存OFFでは、元MIDI / Songを`savedMidis`へ永続化しない。

ClipはImport保存設定とは独立し、Library Tabで明示的に保存ボタンを押した場合だけ`savedClips`へ保存する。
Clip recordは元MIDI binaryを含まない。

## 削除
- MIDI削除 → `savedMidis`対象recordのみ削除
- Clip削除 → `savedClips`対象recordのみ削除
- 一方の削除で他方を連鎖削除しない

## エラー方針
IndexedDB保存に失敗してもMIDI Import成功結果は破棄しない。
MIDI保存失敗とClip保存失敗は別に表示する。

## Testing
Node unit testでは`fake-indexeddb`を利用する。
確認対象:
- v1→v2 migration
- 既存`savedMidis` record保持
- MIDI CRUD
- Clip CRUD
- savedAt降順一覧
