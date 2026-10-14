# Current Release

更新日: 2026-10-14

- 公開候補Version: `v0.13-dev`
- main統合PR: `#36`
- main merge commit: `150543dad6838358ff3fb5200a05c4d1d13960d9`
- 現行ReleaseのCHANGELOG正本: `versions/v0.13-dev/CHANGELOG_v0.13-dev.md`
- 交換形式: SongProject v1 (`schemaVersion: 1`)
- 一時受け渡しKey: `music-project-songproject-handoff-v1`

## 公開済み導線

1. Exportで「1. 曲データを保存」
2. `_song_project_v1.json` を端末バックアップとして保存
3. 同じChromeではDemo Composer向け一時受け渡しも保存
4. 「2. Demo Composerを開く」
5. Demo Composer側で明示的に「受け取った曲を反映」

一時受け渡しが使えない場合は、保存済みSongProject JSONから復帰する。

## 互換性

- SongProject v1は変更しない。
- 既存Analysis Export / legacy Demo Composer export / MIDI / Clip / Stem / IndexedDBを維持する。
- 自動反映は行わない。

## 検証

PR #36およびmainでUnit test / Production build / Basic Pitch asset check / 360・390・430px Mobile Chromium regression / GitHub Pages deployが成功済み。

## stable tag

未作成。Android実機および必要なCubasis/Cubase実機確認後のみ作成する。

> `CHANGELOG.md` / `VERSION_HISTORY.md` は過去履歴を保持する累積ログ。現行v0.13-devのRelease記録は上記Version別CHANGELOGを正本とする。
