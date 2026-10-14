Version: v0.17-dev
更新日: 2026-10-14

【追加】
・MIDI読み込み後に初心者モードを初期表示。
・Key / 音域 / 音の動き / リズム / 反復を初心者向けの5項目へ要約。
・「良いところ」「改善するとよいところ」「次に試すこと（最大3件）」を端末内解析から表示。
・初心者モード / 詳細モード切替と端末内の表示設定保存。
・初心者要約のNode unit test。
・360 / 390 / 430pxで初心者→詳細13タブ→初心者のモバイルChromium回帰をCIへ追加。

【変更】
・Versionをv0.16-devからv0.17-devへ更新。
・MIDI読み込み直後の主導線を、詳細タブ直行から初心者向け要約へ変更。
・詳細解析自体は削除せず、そのまま詳細モードに保持。

【修正】
・初心者が大量の解析タブと専門指標を最初から判断しなければならなかった情報設計を改善。

【互換性】
・元MIDI / Normalized Song / Analyzer候補順位を変更しない。
・SongProject v1 / IndexedDB version 3 / Clip / Stem / Memo形式を変更しない。
・外部AIへの自動送信を追加しない。

【復元ポイント】
・restore/develop-before-beginner-mode-v0.17-20261014

【未対応】
・Android実機でのタッチ操作・PWA再起動後のモード保持確認。
・Cubasis / Cubase実機回帰。
・stable tag作成（実機確認後のみ）。
