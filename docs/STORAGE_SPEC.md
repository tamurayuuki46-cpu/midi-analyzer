# STORAGE_SPEC.md

## Version
v0.1-dev

## 目的
MIDI Analyzerで読み込んだMIDIを、ユーザーが明示的に選んだ場合だけAndroid端末内へ保存する。

## 基本ルール
- 初期値は「保存しない」
- 保存OFFの場合、元MIDIデータをIndexedDBへ保存しない
- 保存ONの場合のみIndexedDBへ保存する
- 保存データをクラウド、外部API、他アプリへ自動送信しない
- v0.1では保存データの共有・Exportを行わない
- 保存済みMIDIは一覧から削除できる

## 保存対象
保存ONの場合、以下を1 recordとして保持する。

```text
storageSchemaVersion
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

`midiBytes` は元MIDIのArrayBuffer。
`song` はMIDI Schema v0.1へ正規化した読み取り専用データ。

## IndexedDB
Database:
`midi-analyzer`

Version:
`1`

Object Store:
`savedMidis`

Key:
`id`

Index:
`savedAt`

Storage Schema変更時はDB versionを上げ、Migration方針を先にdocsへ記録する。

## 保存OFF時
現段階では分析履歴機能が未実装のため、元MIDI / Songを永続化しない。

将来Analysis Resultの履歴保存を追加する場合も、保存OFF時は元MIDI binaryを含めない。

## 削除
削除操作はユーザー確認後に行う。
削除は端末内IndexedDBから対象recordを削除する。

## エラー方針
IndexedDB保存に失敗しても、MIDI Import自体の成功結果は破棄しない。
画面上に「読み込み成功 / 保存失敗」を分けて表示する。

## Testing
Node unit testでは本番コードを変更せず、`fake-indexeddb` をdevDependencyとして利用する。
