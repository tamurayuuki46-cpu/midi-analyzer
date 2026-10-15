# CHANGELOG v0.25-dev

Version: v0.25-dev
更新日: 2026-10-15

【追加】
- Intent-driven Diagnostic Loopを追加。
- 「特徴を確認」「Section差」「サビ候補の持ち上がり」「緊張感・浮遊感」「着地・終止感」「Climax位置」の目的選択を追加。
- 目的とEvidenceを照合して、見直し候補TOP3を並べ替えるIntent Layerを追加。
- 各候補に「なぜ候補か」のrationaleを追加。
- 1回に1項目だけ変更するSingle-variable Experimentを追加。
- ExperimentにtargetSections / keepConstant / A/B/C比較方向 / verificationを追加。
- 選んだ1項目だけをArrangement Labへ渡すproposal-only handoffを追加。
- 採用 / 見送りをlocalStorageへ端末内記録するExperiment Historyを追加。
- `docs/INTENT_DIAGNOSTIC_LOOP_SPEC.md`を追加。
- v0.25専用unit testを追加。

【変更】
- Structure内Diagnostic Loop UIをv0.25へ更新。
- 見直し候補を「内部の一般優先順」だけでなく、ユーザーの今回の目的を加味して表示するよう変更。
- Arrangement Lab handoffはSchema v1 / type / proposal-onlyを維持しつつ、userIntent / rationale / experimentを追加。
- handoffはTOP3一括ではなく、ユーザーが明示的に選んだ1項目を渡す方式へ変更。
- READMEの現在Versionをv0.25-dev、公開中Versionをv0.24-devへ同期。

【修正】
- READMEの公開中Version表記がv0.23-devのまま残っていた不整合を修正。

【データ安全性】
- Normalized Song変更なし。
- SongProject v1変更なし。
- IndexedDB `midi-analyzer` version 3維持。
- Stem DB version 1維持。
- 保存済みデータのMigrationなし。
- 元MIDIを自動変更しない。
- Arrangement Labへ自動Mergeしない。
- 内部score / weightをUI・handoffへ公開しない。
- Experiment HistoryはlocalStorageのみ。

【未対応】
- v0.25のmain公開は未実施。develop統合・CI確認後に別途判断する。
- stable tagはAndroid実機および必要なCubasis/Cubase実機確認後のみ作成する。
