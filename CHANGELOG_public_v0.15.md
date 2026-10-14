Version: v0.15-dev
更新日: 2026-10-14

【追加】
・右上「📦 曲データ」に「📓 メモ帳」を追加。
・SongProject v1を開いた場合はProject IDごとにメモを端末へ自動保存。
・直接MIDI解析した場合は解析ファイル名をAnalyzer用IDとしてメモを分離。
・Android共有画面からGoogle Drive / NotionへTXT共有できる導線を追加。
・Android共有画面からChatGPTへメモを共有できる導線を追加。
・Web Share API非対応時はTXT保存、クリップボードコピー、ChatGPT起動へフォールバック。

【変更】
・公開版MIDI Analyzerをv0.15-devへ更新。

【修正】
・同名の別SongProjectでメモが混ざらないようProject IDを保存キーに使用。
・共有キャンセルを成功扱いしない。

【互換性】
・SongProject schemaVersion 1据え置き。
・既存MIDI / Clip / Stem / IndexedDB形式は変更しない。

【テスト】
・songDataMenu testでメモModule、保存キー、Drive / Notion / ChatGPT共有導線、直接MIDI解析時の識別、Version表示を検証。
・develop側ではUnit tests / Production build / Basic Pitch asset / Mobile Chromium回帰に合格済み。

【復元ポイント】
・restore/main-before-song-memo-public-v0.15-20261014

【未対応】
・Android実機で共有先にGoogle Drive / Notion / ChatGPTが表示され、実際に保存・転送できることの確認。
・Cubasis / Cubase実機確認。
・stable tag作成（実機確認後のみ）。
