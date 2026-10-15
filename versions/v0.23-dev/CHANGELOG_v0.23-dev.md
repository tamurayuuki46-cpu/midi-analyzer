# v0.23-dev

更新日: 2026-10-15
状態: Phrase / Section / Compare / Top5 Insight — develop統合済み

## 追加
- Phrase contour候補（arch / valley / ascending / descending / mixed）
- Melody最高音 / 最低音 / 曲内位置Evidence
- Pitch・Velocity・周辺密度によるClimax候補
- SectionごとのLanding pitch / Degree / Chord・Scale relation比較
- Reference MIDI vs 自作曲の差分説明 Top 5
- 曲全体の特徴 Top 5（Evidence + Meaning）
- Structure TabのInsight表示
- Compare Tabの「違いの要点」表示
- Insight専用Unit Test
- v0.23 Mobile Chromium回帰

## 変更
- Versionを`v0.23-dev`へ更新
- package versionを`0.23.0-dev`へ更新
- アプリ画面内Versionをv0.23-devへ更新
- README / AI_HANDOFF / INSIGHT_ANALYSIS_SPECをv0.23へ同期
- Mobile regressionをv0.23のStructure Insight確認へ拡張

## 修正
- なし

## 自動検証
PR #58および統合後developで次を確認。
- Unit tests: success
- Production build: success
- Basic Pitch local model assets: success
- Mobile Chromium regression: success
- Mobile widths: 360 / 390 / 430px
- Structure v0.23 Insight表示: success
- Console error regression: success

## 安全性
- Normalized Song変更なし
- SongProject v1変更なし
- IndexedDB v3変更なし
- 保存済みMIDI / Clip / Stem変更なし
- 自動Note修正なし
- 自動作曲 / 自動編曲なし
- Reference MIDI自動保存なし
- main直接変更なし
- stable tag未作成

## Git
- 実装Issue: `#57`
- 実装PR: `#58`（develop統合済み）
- 統合commit: `41a6b0e53725aaf39fd67d4ad2085986cb00cbff`
- 変更前復元ポイント: `restore/develop-before-insight-v0.23-20261015`
- feature-complete milestone: `chatgpt/v0.23-feature-complete-milestone`

## 未対応
- Climax候補の実曲チューニング
- Section名確定後のVerse / Bメロ / Chorus比較
- 解決速度・方向のReference比較
- Android実機最終確認
- Cubasis / Cubase実機回帰

`main` / 公開Versionはv0.18-devのまま。stable tagは実機確認後のみ作成する。
