# AGENTS.md

ChatGPT / Codex向けの作業指示。

重要な製品仕様・Schema・分析ルールはここだけに書かず、必ず `docs/` を更新すること。

## 作業開始時
以下を順に確認する。

1. README.md
2. VERSION
3. docs/AI_HANDOFF.md
4. docs/PRODUCT_SPEC.md
5. docs/ANALYSIS_SPEC.md
6. docs/MIDI_SCHEMA.md
7. docs/ARCHITECTURE.md
8. CHANGELOG.md

確認後、
- 現在Version
- 実装済み
- 作業対象
- 変更しない部分
- Schemaへの影響
- Backup要否
を把握する。

## Git
- `main`: 安定版専用
- `develop`: 開発統合
- ChatGPT / Codex: `chatgpt/*`
- Claude: `claude/*`
- 他AIの作業Branchを無断で大規模編集しない
- 過去Version / 復元Branchを削除・上書きしない

## 終了時
必要に応じて更新:
- docs/AI_HANDOFF.md
- CHANGELOG.md
- VERSION
- README.md
- 関連docs
