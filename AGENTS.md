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
9. docs/RELEASE_POLICY.md

確認後、
- 現在Version
- 実装済み
- 作業対象
- 変更しない部分
- Schemaへの影響
- Backup要否
を把握する。

## Git
- `develop`: 開発統合
- `main`: 自動テスト・build・回帰CI合格版。実機未確認でも可
- `stable tag`: Android実機、および該当するCubasis / Cubase実機確認済み版だけに付与
- ChatGPT / Codex: `chatgpt/*`
- Claude: `claude/*`
- main統合前に復元Branchを作る
- 他AIの作業Branchを無断で大規模編集しない
- 過去Version / 復元Branch / stable tagを削除・上書きしない
- 詳細は `docs/RELEASE_POLICY.md` を正本とする

## 終了時
必要に応じて更新:
- docs/AI_HANDOFF.md
- CHANGELOG.md
- VERSION
- README.md
- VERSION_HISTORY.md
- 関連docs
