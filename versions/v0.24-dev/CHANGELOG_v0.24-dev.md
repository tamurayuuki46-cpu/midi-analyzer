# MIDI Archive/Analyzer v0.24-dev CHANGELOG

Version: v0.24-dev
更新日: 2026-10-15

【追加】
・SectionごとのNote密度 / Melody音域 / Chord Tone率 / 着地Degreeをまとめて比較するDiagnostic Loopを追加。
・隣接Sectionの差を自然文で説明するMeaning Layerを追加。
・Evidenceに基づく「見直し候補 TOP 3」を追加。内部weightは品質Scoreとして公開しない。
・見直し候補を`midi-analyzer-arrangement-handoff` JSONとしてArrangement Labへ明示受け渡しできる導線を追加。
・対応端末では共有メニュー、未対応端末ではJSON DownloadへFallback。
・Compare Tabに「修正前 → 修正後の再分析」を追加。
・Diagnostic Loop unit testを追加。
・`docs/DIAGNOSTIC_LOOP_SPEC.md`を追加。

【変更】
・Versionをv0.23-devからv0.24-devへ更新。
・Compareの比較用ファイル欄を「参考曲 / 修正前MIDI」として兼用可能に変更。
・Structure詳細にSection比較、意味付け、見直しTOP3、Arrangement Lab handoffを追加。

【修正】
・分析値が数値表示だけで終わりやすかった導線を、Evidence → Meaning → Actionへ接続。
・「分析後に何をすればよいか」が分かりにくい問題を、最大3件の比較候補へ絞って改善。

【互換性】
・Normalized Song変更なし。
・SongProject Schema変更なし。
・IndexedDB Schema変更なし。
・既存保存データMigrationなし。
・既存Key / Chord / Section候補順位変更なし。
・自動作曲 / 自動編曲 / 自動Uploadなし。

【復元ポイント】
・`restore/develop-before-diagnostic-loop-v0.24-20261015`

【未対応】
・Arrangement Lab側でhandoff JSONを直接Importして実験セットを自動作成する受信UI。
・Android実機で共有メニュー / JSON Download / 360・390・430px表示の最終確認。
・stable tag作成（実機確認後のみ）。
