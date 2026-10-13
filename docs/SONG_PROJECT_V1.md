# SongProject v1 — MIDI Analyzer連携

MIDI Analyzerは作曲アプリ群の共通交換JSONとして `SongProject v1` を使用する。

## MIDI Analyzerの担当

- 新しいMIDIからSongProjectを作る場合: `analysis` と初期素材を生成する。
- 既存SongProjectを読み込む場合: `analysis` と解析対象の `reference` metadataを更新する。
- 既存SongProjectの `intent` / `composition` / `arrangement` / `history` / `assets` / `export` は保持する。
- 既存SongProjectのBPM/Keyは既定では上書きしない。解析値は `analysis` に保存する。

## 外部ファイル

MIDI / Audio / StemのBlobそのものはSongProject JSONへ埋め込まない。Stem等の保存情報は `reference` metadata、アプリ群で共有する外部ファイル参照は `assets.files` に置く。

## Canonical top-level

`kind: "song-project"`, `schemaVersion: 1` を維持し、以下の領域を共通契約とする。

`lineage / intent / basic / analysis / composition / arrangement / history / reference / assets / export / compatibility`

破壊的変更が必要になるまではv1内で後方互換を維持する。
