# v0.23-dev VERSION HISTORY ENTRY

更新日: 2026-10-15

## 状態
Phrase / Section / Compare / Top5 Insightを実装し、PR #58でdevelopへ統合済み。既存AnalyzerのEvidenceを初心者向けにまとめるRead-only Insight Layerを追加した。

## 主な変更
- Phrase contour / Peak / Climax candidate
- Section Landing比較
- Reference MIDI vs Own MIDI差分説明 Top 5
- Whole-song characteristics Top 5
- Structure / Compare UI統合
- Unit / Mobile Chromium regression追加

## 設計
InsightはRead-only。

- 既存Analyzer順位を変更しない
- 元MIDIを変更しない
- SongProjectを変更しない
- 保存Schemaを変更しない
- 品質Scoreとして扱わない

## Schema
変更なし。
- Normalized Song: 変更なし
- SongProject v1: 変更なし
- IndexedDB: version 3維持

## Git
- Issue: `#57`
- PR: `#58`
- develop統合commit: `41a6b0e53725aaf39fd67d4ad2085986cb00cbff`
- 変更前復元ポイント: `restore/develop-before-insight-v0.23-20261015`
- feature-complete milestone: `chatgpt/v0.23-feature-complete-milestone`

## 自動検証
- Unit tests: success
- Production build: success
- Basic Pitch local model assets: success
- Mobile Chromium 360 / 390 / 430px: success
- 統合後develop CI: success

## stable
未作成。Android実機および必要なCubasis/Cubase確認後のみ作成する。

## 公開
`main` / GitHub Pagesはv0.18-devのまま。v0.23のmain昇格・公開はこの作業では行っていない。
