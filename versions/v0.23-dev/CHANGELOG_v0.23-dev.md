# v0.23-dev

更新日: 2026-10-15
状態: Phrase / Section / Compare / Top5 Insight

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
- Mobile regressionをv0.23のStructure Insight確認へ拡張

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

## 復元ポイント
- `restore/develop-before-insight-v0.23-20261015`

## 開発Branch
- `chatgpt/insight-v0.23`

## Issue
- `#57`

## 未対応
- Climax候補の実曲チューニング
- Section名確定後のVerse / Bメロ / Chorus比較
- 解決速度・方向のReference比較
- Android実機最終確認
- Cubasis / Cubase実機回帰
