Version: v0.17-dev
更新日: 2026-10-15

【追加】
・MIDI読み込み後に初心者モードを初期表示。
・Key / 音域 / 音の動き / リズム / 反復を初心者向けの5項目へ要約。
・「良いところ」「改善するとよいところ」「次に試すこと（最大3件）」を端末内解析から表示。
・初心者モード / 詳細モード切替と端末内の表示設定保存。
・初心者要約のNode unit test。
・360 / 390 / 430pxで初心者→詳細13タブ→初心者のモバイルChromium回帰をCIへ追加。
・SongProject v1でAnalyzer所有領域 `analysis/reference` と非所有領域のデータ保持を独立検証する `test/songProjectOwnershipContract.test.js` を追加。
・CIへSongProject所有権/データ保持契約テストを必須ステップとして追加。

【変更】
・Versionをv0.16-devからv0.17-devへ更新。
・MIDI読み込み直後の主導線を、詳細タブ直行から初心者向け要約へ変更。
・詳細解析自体は削除せず、そのまま詳細モードに保持。
・README / docs/AI_HANDOFF / VERSION / package.jsonをv0.17-dev基準へ整合。
・2026-10-15の安定化開始時、旧developがmainの祖先であることを確認し、restore point作成後にmain→developをfast-forward同期。

【修正】
・初心者が大量の解析タブと専門指標を最初から判断しなければならなかった情報設計を改善。
・SongProject `compatibility.midiAnalyzer.appVersion` がv0.16-devのままだった不整合をv0.17-devへ修正。
・古いAI_HANDOFFのv0.12-dev記載を現在状態へ整理。

【互換性】
・元MIDI / Normalized Song / Analyzer候補順位を変更しない。
・SongProject v1 / IndexedDB version 3 / Clip / Stem / Memo形式を変更しない。
・Analyzer mergeは既定でlineage / intent / basic / composition / arrangement / history / assets / exportを保持する。
・外部AIへの自動送信を追加しない。

【復元ポイント】
・restore/develop-before-beginner-mode-v0.17-20261014
・restore/develop-before-stabilization-20261015
・Drive: 作曲支援アプリ安定化_backup_2026-10-15_demo-v0.15-dev_midi-v0.17-dev

【未対応】
・Android実機でのタッチ操作・PWA再起動後のモード保持確認。
・Cubasis / Cubase実機回帰。
・stable tag作成（実機確認後のみ）。
