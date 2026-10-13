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
  "conversionStatus": "not-converted",
  "analysisStatus": "not-analyzed",
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

## 未対応

- StemからBasic Pitchへ直接送るボタン
- SongProject.referenceへの自動同期
- storage quota / evictionの詳細UI
- File System Access API利用

これらはAndroid Chrome実機のstorage quota確認後に拡張します。
