# v0.23-dev VERSION HISTORY ENTRY

更新日: 2026-10-15

## 状態
v0.22-devのNote Function IIを保持し、既存AnalyzerのEvidenceを初心者向けにまとめるInsight Layerを追加。

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

## 復元ポイント
`restore/develop-before-insight-v0.23-20261015`

## 開発Branch
`chatgpt/insight-v0.23`

## Issue
`#57`

## stable
未作成。Android実機および必要なCubasis/Cubase確認後のみ作成する。
