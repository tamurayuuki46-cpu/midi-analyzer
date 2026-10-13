# MIDI Analyzer → Demo Composer 受け渡しガイド

更新日: 2026-10-14

## 初心者向け導線

Export画面では以下だけを前面に出す。

1. `曲データを保存`
2. `Demo Composerを開く`
3. Demo Composer側で `受け取った曲を反映`

保存形式はSongProject v1 JSONだが、初心者向けの主ボタンではJSON / Schemaという用語を前面に出さない。

## 保存と一時受け渡し

`曲データを保存` を押すと、まず `<song>_song_project_v1.json` を端末へ保存する。

同じChromeで次のアプリへ進む場合は、同じOriginのlocalStorageへSongProjectを一時保存する。

Storage key:

`music-project-songproject-handoff-v1`

Payload:

- kind: `music-project-songproject-handoff`
- schemaVersion: `1`
- sourceApp: `midi-analyzer`
- targetApp: `demo-composer`
- createdAt
- songProject

localStorageは便利機能であり正本ではない。失敗しても先に保存したJSONをDemo Composerで選択すれば続行できる。

## データ所有権

MIDI AnalyzerはSongProjectの `analysis` / `reference` を主に更新する。

既存SongProjectを読み込んだ場合は、Demo Composerの `composition`、Arrangement Labの `arrangement`、作曲シートの `intent` を削除しない。

## 詳細書き出し

以下は `もっと詳しい書き出し` 内に残す。

- 既存SongProjectを開く
- SongProject v1
- Analysis JSON
- CSV
- Markdown Report
- Chord / Degree Text
- 旧Demo Composer project.json
- 端末共有メニュー

## 安全性

- 次アプリでの反映は自動実行しない。
- Demo Composerでユーザーが明示的に `受け取った曲を反映` を押す。
- SongProject v1のschemaVersionは変更しない。
- 元MIDI / Clip / Stem / IndexedDB保存形式は変更しない。
