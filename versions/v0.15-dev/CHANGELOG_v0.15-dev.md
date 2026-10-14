Version: v0.15-dev
更新日: 2026-10-14

【追加】
・画面右上に全アプリ共通の `📦 曲データ` メニューを常設。
・解析前でも既存SongProject v1を右上から開けるようにした。
・解析後は右上から「今の曲を保存」「Demo Composerへ進む」を実行可能化。
・360 / 390 / 430px Mobile Chromium回帰へ右上メニューの表示・disabled切替・横overflow確認を追加。

【変更】
・既存SongProjectを先に開いた場合、そのタブのsessionStorageで一時保持し、解析完了後に既存Exportのmerge処理へ渡す方式にした。
・詳細Analysis JSON / CSV / Markdownのファイル名Versionをv0.15へ更新。
・SongProject compatibility.midiAnalyzer.appVersionをv0.15-devへ更新。

【修正】
・JSON入出力の場所がExportタブまで移動しないと見つからない問題を、常設入口で解消。

【互換性】
・SongProject v1 / schemaVersion 1据え置き。
・既存MIDI / Clip / Stem / IndexedDB互換を維持。
・既存SongProjectへの解析書き戻し時、composition / arrangement / intent等を保持。

【復元ポイント】
・`restore/develop-before-song-data-menu-20261014`

【未対応】
・Android実機で右上メニュー、ファイルピッカー、safe-areaを確認。
・Cubasis / Cubase実機確認。
・stable tag作成（実機確認後のみ）。
