# v0.22-dev VERSION HISTORY ENTRY

更新日: 2026-10-15

## 状態
Resolution / Landing Analysis（Note Function II）を実装中。v0.21-devのChord Tone / Scale Tone / Passing / Neighbor / Approachを保持し、時間・拍・Chord change・Phrase LandingのEvidenceを追加する。

## 主な変更
- Resolution candidate + Evidence
- Strong / weak musicalBeat context
- Suspension / Anticipation candidate
- Phrase landing + Degree summary
- Piano Roll evidence
- v0.21回帰を含む自動テスト追加

## Schema
変更なし。
- Normalized Song: 変更なし
- SongProject v1: 変更なし
- IndexedDB: version 3維持

## 復元ポイント
`restore/develop-before-resolution-landing-v0.22-20261015`

## 開発Branch
`chatgpt/resolution-landing-v0.22`

## stable
未作成。Android実機および必要なCubasis/Cubase確認後のみ作成する。
