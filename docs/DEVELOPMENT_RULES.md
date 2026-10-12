# DEVELOPMENT_RULES.md

## Branch
- main: 安定版
- develop: 統合開発
- chatgpt/*: ChatGPT / Codex
- claude/*: Claude

## Version
- 過去Versionを削除しない
- 上書きしない
- 大規模変更前に復元ポイントを作る

## 復元ポイント必須
- MIDI Schema変更
- Analysis Engine大変更
- Storage変更
- Framework導入
- RipX Bridge導入
- Demo Composer連携
- 大規模Refactor

## 仕様の正本
`docs/`

AGENTS.md / CLAUDE.mdにはAI固有操作だけを書く。

## 変更手順
1. 現在挙動確認
2. 変更目的確認
3. 影響範囲確認
4. Backup要否判断
5. 最小変更
6. 動作確認
7. docs / CHANGELOG / AI_HANDOFF更新
