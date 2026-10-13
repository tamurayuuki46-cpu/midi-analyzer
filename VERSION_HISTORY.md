# VERSION_HISTORY

## v0.10-dev — 2026-10-13
状態: SongProject v1 / Basic Pitch / Key変更 / Stem連携実装、自動テスト・Production Build合格。Git運用を変更し、`main`を自動テスト合格版、`stable tag`をAndroid実機および必要なCubasis/Cubase実機確認済み版とする。

復元ポイント:
- `backup/v0.9-dev_before_songproject`
- `backup/v0.10-dev_songproject-integrated`

main統合候補develop:
- `cca7e8a684abef325fa42ce080ff75c9c6dc2d61`

stable tag:
- 未作成（実機確認後）

## v0.9-dev — 2026-10-13
状態: v0.7 Integration / v0.8 Explainability / v0.9 Metrics実装完了 / 103 tests pass / Bridge構文・Production Build確認済み

主な内容:
- Demo Composer Schema 3 Export Adapter
- JSON / CSV / Markdown / Chord-Degree Text Export
- Android共有メニュー
- RipX Bridge Prototype / PC→Android LAN転送
- 端末内Explainability / この曲から学べること
- 外部AI Prompt Export（自動送信なし）
- Floating / Chorus-likeness / Surprise / Repetition-Variation / Counter Presence / Arrangement Density
- Export / AI / Metrics Tab
- Analysis Bundle共通Read Model
- v0.7〜v0.9 regression tests

設計方針:
- v1.0統合前にv0.2〜v0.9の機能Scopeを埋める
- Demo Composer Schemaを改変せずAdapterで変換する
- Analyzer Section候補をVerse / Chorusへ自動確定しない
- Explainabilityは端末内の候補説明であり、外部AIへ自動送信しない
- v0.9 Scoreは品質・人気・正解の採点ではない
- 元MIDI / Normalized Song / 既存Analyzer候補順位を変更しない

復元ポイント:
- `chatgpt/v0.7-before-integration-export`
- `chatgpt/v0.9-feature-complete-milestone`

（v0.8以前の履歴は既存内容を保持）
