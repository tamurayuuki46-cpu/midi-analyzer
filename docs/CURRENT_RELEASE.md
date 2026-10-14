# Current Release

更新日: 2026-10-14

- 公開候補Version: `v0.14-dev`
- main統合候補: `release/mobile-first-flow-v0.14`
- 現行ReleaseのCHANGELOG正本: `versions/v0.14-dev/CHANGELOG_v0.14-dev.md`
- 現行Version履歴: `versions/v0.14-dev/VERSION_HISTORY.md`
- 交換形式: SongProject v1 (`schemaVersion: 1`)
- 一時受け渡しKey: `music-project-songproject-handoff-v1`

## 公開候補の導線

`⓪ 作曲シート → ① MIDI解析（任意） → ② Demo Composer → ③ Arrangement Lab → ④ DAW`

MIDI Analyzerは①の任意工程。公開mainでは⓪からDemo Composer Project Home内の作曲シート（Claude Artifact）登録欄へ案内する。

Exportでは以下を一本道にする。

1. 「1. 曲データを保存」を主操作として表示
2. `_song_project_v1.json` を端末バックアップとして保存
3. 同じChromeではDemo Composer向け一時受け渡しも保存
4. 保存成功後は「2. Demo Composerを開く」だけを主操作へ切替
5. Demo Composer側で明示的に「受け取った曲を反映」

一時受け渡しが使えない場合は、保存済みSongProject JSONから復帰する。

## 互換性

- SongProject v1は変更しない。
- 公開mainのRecorderタブと旧Recorder Takeを維持する。
- 既存Analysis Export / legacy Demo Composer export / MIDI / Clip / Stem / IndexedDBを維持する。
- 自動反映は行わない。

## 検証

main基準Release BranchでUnit test / Production build / Basic Pitch asset check / 360・390・430px Mobile Chromium regressionを合格させてからmainへ統合する。Mobile ChromiumではRecorderを含む公開mainの全解析タブ、5段階表示、主ボタン切替、SongProject download、localStorage、横overflow、Console errorを確認する。

## stable tag

未作成。Android実機および必要なCubasis/Cubase実機確認後のみ作成する。

> `CHANGELOG.md` / `VERSION_HISTORY.md` は過去履歴を保持する累積ログ。現行v0.14-devのRelease記録はVersion別CHANGELOGを正本とする。
