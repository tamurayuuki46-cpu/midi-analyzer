# CHANGELOG v0.16-dev

更新日: 2026-10-14

【追加】
- 右上 `📦 曲データ` に `📓 メモ帳` を追加。
- SongProject v1を開いた場合はProject IDごと、直接MIDI解析した場合は解析ファイルごとにメモを分離。
- 入力中の端末自動保存。
- Android共有画面からGoogle Drive / NotionへTXTを共有する導線。
- Android共有画面からChatGPTへメモを転送する導線。
- Web Share API非対応時のTXT保存、クリップボードコピー、ChatGPT起動フォールバック。

【変更】
- MIDI Analyzer開発Versionをv0.16-devへ更新。

【修正】
- 同名の別SongProjectでメモが混ざらないようProject IDを保存キーに使用。

【互換性】
- SongProject schemaVersion 1据え置き。
- IndexedDB version 3据え置き。
- Clip / Stem / MIDI形式変更なし。

【復元ポイント】
- `restore/develop-before-song-memo-v0.16-20261014`

【未対応】
- Android実機でGoogle Drive / Notion / ChatGPTが共有先として表示され、保存・転送が完了することの確認。
- Cubasis / Cubase実機確認。
- stable tag作成（実機確認後のみ）。
