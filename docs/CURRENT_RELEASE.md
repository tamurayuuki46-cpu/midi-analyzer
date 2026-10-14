# Current Release

更新日: 2026-10-14

- 公開Version: `v0.17-dev`
- main統合候補: `release/v0.17-public-20261014`
- 現行ReleaseのCHANGELOG正本: `versions/v0.17-dev/CHANGELOG_v0.17-dev.md`
- 交換形式: SongProject v1 (`schemaVersion: 1`)
- 一時受け渡しKey: `music-project-songproject-handoff-v1`

## 公開導線

`⓪ 作曲シート → ① MIDI解析（任意） → ② Demo Composer → ③ Arrangement Lab → ④ DAW`

MIDI Analyzerは①の任意工程。v0.17-devではMIDI読み込み後に初心者モードを標準導線として表示し、必要な場合だけ詳細13タブへ切り替える。

初心者モードでは以下を一画面で確認する。

- Key候補
- 音域
- 音の動き
- リズム
- 反復
- 良いところ
- 改善するとよいところ
- 次に試すこと（最大3件）

## 互換性

- SongProject v1は変更しない。
- 既存MIDI / Clip / Stem / IndexedDB形式を維持する。
- 曲メモ帳のlocalStorage保存を維持する。
- 詳細13タブを維持する。
- 解析結果や曲データを外部AIへ自動送信しない。

## 検証

release Branch / developでUnit test、Production build、Basic Pitch asset check、360・390・430px Mobile Chromium regressionを合格させてからmainへ統合する。公開後はGitHub PagesのURLと主要画面を確認する。

## 復元ポイント

- `restore/main-before-v0.17-public-20261014`

## stable tag

未作成。Android実機および必要なCubasis/Cubase実機確認後のみ作成する。
