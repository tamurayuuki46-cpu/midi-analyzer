# v0.25-dev Restore Point

更新日: 2026-10-15

## 変更前
- develop commit: `65667b01adc8c050c18e040c562b3aab40a937a6`
- Restore branch: `restore/develop-before-intent-loop-v0.25-20261015`

## 開発Branch
- `chatgpt/midi-analyzer-v0.25-intent-loop`

## 復元方針
v0.25 Intent Layerに問題がある場合、上記Restore branchへ戻せばv0.24公開同期後のdevelop状態を復元できる。

v0.25はNormalized Song / SongProject / IndexedDB Schemaを変更しないため、Schema rollbackや保存済みデータMigrationの巻き戻しは不要。

## main / stable
- mainはv0.24-dev公開版のまま変更しない。
- stable tagは未作成。Android実機および必要なCubasis/Cubase実機確認後のみ作成する。
