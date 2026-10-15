# VERSION HISTORY ENTRY — v0.25-dev

更新日: 2026-10-15
状態: Intent-driven Experiment Loop実装 / feature branch検証中

## 主な内容
- v0.24 Diagnostic Loop上にIntent Layerを追加。
- ユーザーの今回の目的に応じて既存EvidenceのTOP3を並べ替え。
- 各候補へrationale（なぜ候補か）を追加。
- 1回に1項目だけ試すSingle-variable Experimentを追加。
- targetSections / keepConstant / A-B-C比較方向 / verificationを追加。
- 選択した1候補だけをArrangement Labへproposal-only handoff。
- 採用 / 見送りをlocalStorageへ端末内記録。
- v0.24の修正前→修正後再分析を継続利用。

## 設計方針
- 新しい分析指標を増やすより、既存Evidenceを作曲意図と比較行動へ接続する。
- 品質Score / 正解判定は行わない。
- Analyzerは曲を自動変更しない。
- Reharmonize / Voicing / 密度・展開変更 / 編曲案生成はArrangement Labの責務。
- SongProject / IndexedDB Schemaは変更しない。

## 復元ポイント
- `restore/develop-before-intent-loop-v0.25-20261015`

## 開発Branch
- `chatgpt/midi-analyzer-v0.25-intent-loop`

## stable
- 未作成。Android実機および必要なCubasis/Cubase実機確認後のみ作成する。
