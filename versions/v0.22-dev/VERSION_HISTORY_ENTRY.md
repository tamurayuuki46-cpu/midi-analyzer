# v0.22-dev VERSION HISTORY ENTRY

更新日: 2026-10-15

## 状態
Resolution / Landing Analysis（Note Function II）を実装し、PR #55で`develop`へ統合済み。

v0.21-devのChord Tone / Scale Tone / Passing / Neighbor / Approachを保持し、時間・拍・Chord change・Phrase LandingのEvidenceを追加した。

## 主な変更
- Resolution candidate + Evidence
- Strong / weak musicalBeat context
- Suspension / Anticipation candidate
- Phrase landing + Degree summary
- Piano Roll evidence
- 初心者Metric → Meaning → Action連携
- v0.21回帰を含む自動テスト追加
- v0.22 UIを360 / 390 / 430px Mobile Chromium regressionへ追加

## 修正
- Chord境界前に別NoteがあるSuspension探索ケースを修正
- Resolution-only Piano Roll輪郭のstrokeを修正
- アプリVersion表示 / Mobile regressionのv0.21固定値をv0.22へ同期

## 検証
PR #55と統合後developの両方で以下がsuccess。
- Unit tests
- Production build
- Basic Pitch local model assets
- Mobile Chromium regression

## Schema
変更なし。
- Normalized Song: 変更なし
- SongProject v1: 変更なし
- IndexedDB: version 3維持
- Stem DB: version 1維持

## Git
- 変更前develop: `fc29b0613adb5ca826c2fff72487a1423c4658ad`
- 変更前復元ポイント: `restore/develop-before-resolution-landing-v0.22-20261015`
- 実装Branch: `chatgpt/resolution-landing-v0.22`
- PR: `#55`
- v0.22統合commit: `6224947576ec3e925adb7c8881b0bbe02c41b3a7`
- feature-complete milestone: `chatgpt/v0.22-feature-complete-milestone`

## 公開 / stable
- `main` / GitHub Pages公開Versionはまだ`v0.18-dev`
- stable tagは未作成
- Android実機および必要なCubasis/Cubase確認後のみstableを作成する

## 次候補
- Appoggiatura / Escape Tone / Retardation
- Phrase contour / climax / peak note
- Section間Landing比較
- Reference Insightの解決速度 / 方向抽象化
