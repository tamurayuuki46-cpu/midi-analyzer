# 曲データ共通メモ帳 — MIDI Analyzer

Version: v0.16-dev
更新日: 2026-10-14

## 目的

画面右上の `📦 曲データ` から、解析中または読み込み済みSongProjectにひもづくメモをすぐ開けるようにする。

## 曲の識別

- SongProject v1を先に開いた場合: `projectId` を使う。
- MIDIを直接解析した場合: 解析中MIDIのファイル名をAnalyzer用IDにしてメモを分離する。
- 同じ曲名でもProject IDが異なる場合は別メモになる。

## 保存・共有

- `💾 端末に保存`: localStorageへ曲別保存。入力中も自動保存。
- `☁️ Drive / Notion`: Android / 対応ブラウザの共有画面を開き、Google DriveまたはNotionを共有先としてユーザーが選択する。
- `🤖 ChatGPTへ共有`: メモを整理依頼文つきで共有し、共有先でChatGPTを選択できる。
- `📄 TXT保存`: 通常のテキストとしてバックアップ。

Web Share API非対応時はDrive / NotionをTXT保存へ、ChatGPTをクリップボードコピー + ChatGPTを開く動作へフォールバックする。

外部サービスへの自動送信・自動ログイン・直接アップロードは行わない。

## 互換性

- SongProject schemaVersion 1: 変更なし
- MIDI Analyzer IndexedDB version 3: 変更なし
- Clip / Stem / MIDIデータ形式: 変更なし

## 未確認

- Android実機で共有画面にGoogle Drive / Notion / ChatGPTが出ること
- 各共有先で実際に保存・受け取りが完了すること
- stable tagはAndroid + 必要なCubasis/Cubase実機確認後のみ作成する
