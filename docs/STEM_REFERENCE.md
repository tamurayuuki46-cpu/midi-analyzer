# Stem / Reference

更新日: 2026-10-13
対象Version: v0.10-dev

## 方針

Stem分離AIは自作しません。Moises / RipX等でユーザーが書き出したStemをMIDI AnalyzerへImportする方式です。

対応分類:

- vocal
- bass
- piano
- guitar
- drums
- other

## 保存

Audio BlobはSong Project JSONへ埋め込みません。

専用IndexedDB:

`midi-analyzer-stems`

へBlobを保存し、SongProjectへ渡す場合はmetadata参照だけを使用します。

Reference metadata例:

```json
{
  "type": "stem",
  "stemType": "bass",
  "name": "Bass Stem",
  "sourceFileName": "bass.wav",
  "duration": 123.4,
  "conversionStatus": "converted",
  "analysisStatus": "midi-generated",
  "storage": {
    "kind": "indexeddb",
    "database": "midi-analyzer-stems",
    "recordId": "..."
  }
}
```

## UI

- Stem file import
- type / name
- persistent IndexedDB storage
- audio preview
- Solo
- Mute
- conversion status / analysis status表示
- 保存済みStemをBasic Pitchへ直接送信

## Song Project同期

Song Project v1を書き出す時点で、現在端末に保存されているStem metadataを`reference.items`へ自動同期します。

- Audio Blobは含めない
- IndexedDBのrecordIdのみ参照として残す
- 同じStem idは重複追加せず最新metadataで更新する
- composition / arrangementは変更しない

## Stem → Basic Pitch

保存済みStemカードの「Basic Pitchへ送る」から、そのBlobを端末内Audio→MIDI処理へ直接渡します。

変換成功時:

- `conversionStatus: converted`
- `analysisStatus: midi-generated`

へ更新し、生成MIDIは通常のMIDI Analyzer解析経路へ渡します。

## 未対応

- storage quota / evictionの詳細UI
- File System Access API利用
- Android実機での長尺Stem / Basic Pitchメモリ検証

Android Chrome実機確認後にstorage管理を追加拡張します。
