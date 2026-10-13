# CLAUDE.md

Claude向けの作業指示。

重要な製品仕様・Schema・分析ルールはここだけに書かず、必ず `docs/` を正本として更新すること。

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

## Git
- `main`: 安定版専用
- `develop`: 開発統合
- Claude: `claude/*`
- ChatGPT / Codex: `chatgpt/*`

## 重要
- AIが音楽の良し悪しを採点しない
- Candidate / Confidence / Alternative を基本とする
- `selected` は人が選択したときだけ入れる
- 元MIDIの正規化後Noteを分析処理で書き換えない
- Android初心者UXを最優先する
