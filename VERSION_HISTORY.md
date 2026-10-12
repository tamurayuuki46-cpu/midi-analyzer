# VERSION_HISTORY

## v0.1-dev — 2026-10-12
状態: v0.1機能実装中 / 自動テスト継続運用

主な内容:
- MIDI Import / Normalized Song Schema
- IndexedDB端末保存（任意）
- 読み取り専用Piano Roll
- Key / Scale候補 Top 3 + ユーザー選択
- Chord候補 Top 3 + Track選択 + Degree表示
- Melody基本分析（音域 / 跳躍 / 同音連打 / 密度 / Chord Tone）
- Bass基本分析（最低音移動 / Root・3rd・5th・Other / リズム型）
- Rhythm基本分析（拍位置 / シンコペーション候補 / 密度 / 16分Grid）
- Chord選択 / Chord Track変更とBasic Analysis再計算の連動
- Parser / Normalizer / Storage / Piano Roll / Key / Chord / Basic Analysis自動テスト
- GitHub Actionsでtest + production buildを継続確認
- Android-first UI / RipX・Demo Composer連携境界をdocsで管理

未完了のv0.1主要項目:
- 最小簡易再生（Play / Stop）
- Android実機確認
- 実MIDIで分析heuristic / 係数調整

復元ポイント:
- `chatgpt/v0.1-before-midi-import`
- `chatgpt/v0.1-before-indexeddb`
- `chatgpt/v0.1-before-piano-roll`
- `chatgpt/v0.1-before-key-analyzer`
- `chatgpt/v0.1-before-chord-analyzer`
- `chatgpt/v0.1-before-basic-analysis`

最新安定版:
未作成
