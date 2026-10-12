# AI_HANDOFF.md

現在Version:
v0.5-dev

公開中Version:
v0.4-dev

最新安定版:
未作成

## 現在実装済み
- MIDI Import / Parser Adapter / Normalized Song Schema
- Tempo / 拍子 / Track / RipX origin / Warning
- IndexedDB任意保存 / 一覧 / 削除
- Piano Roll
- Key / Scale Top 3 + ユーザー選択
- Chord Top 3 + Degree / Track選択
- 各Chord区間のランキング1位を並べるTop 1コード進行
- Melody / Bass / Rhythm基本分析
- Play / Stop簡易再生 / Tempo Map対応Web Audio
- Motif / 4小節Section / 区間Key / 転調候補
- Slash Chord / add9 / 11 / 6・13候補
- v0.3: 2 MIDI比較 / 参考曲 vs 自作曲 / Personal Trend
- v0.4: 裏メロ候補 / Bass詳細 / Drum詳細 / Track役割候補
- v0.4.1: カテゴリ別Tab UI
- v0.5: Tonal Center / Chord Timeline、Melody/Bass Contour、Rhythm Density、Energy Curve、Section Map、Note/Velocity Heatmap
- GitHub Actions test + build
- GitHub Pages（develop公開）

## v0.5 Visualization設計
- Visual TabをStructureとCompareの間へ追加
- Visualizationは既存Analyzer結果とNormalized Songの表示Layer
- Key / Chord / Section等の候補順位を変更しない
- Melody / Bass Contourは既定Trackの小節平均Pitch
- Rhythm Densityは小節ごとのunique onset密度
- Energy Curveは`onset density × average velocity`を曲内0..1へ正規化した簡易指標
- Heatmapは非Drum NoteのPitch Class × 小節。Android負荷を抑えるため先頭16小節
- Canvas必須にせずHTML/CSS中心

## 次に実施
1. v0.6 Clip / Library
2. IndexedDBを既存`savedMidis`を壊さずmigration
3. Chord / Melody / Bass / Drum / Motifの4小節Clip保存
4. Genre / Mood / BPM / Key / custom tag検索
5. Android実機でVisual / Library操作確認
6. RipX / Scaler / EZkeys等の実MIDI regression

## 既知の問題 / 継続課題
- SMPTE time division未対応
- Key / Chord / Section / Motif / Part Deepの一部閾値は暫定
- 保存済みMIDIの「開く」は未実装
- PlaybackはGM / 元音色を再現しない簡易preview
- Sectionは固定4小節Block
- pivot chord / common tone転調理由は未対応
- CompareのTrack手動対応 / Section同期比較は未対応
- 裏メロTrackの手動指定UIは未対応
- Fill候補はrule-based簡易判定
- AI Tabはplaceholderのみで説明機能本体は未実装
- Visual Heatmapは先頭16小節表示
- 実ファイルRegressionは継続必要

## 触らない部分
- mainを開発用にしない
- 過去Version / 復元Branchを削除・上書きしない
- Demo Composer project.json Schema
- 元MIDI由来Noteを自動変更しない
- `midi-file` raw event modelを `src/midi/` 外へ漏らさない
- 保存OFF時に元MIDI binaryを永続化しない
- AnalyzerがKey / Chord / Section / Motif / 転調 / Track役割を自動確定しない

## Analysis Result追加分
- Compare Summary: `{ name, key, bpm, melodyRange, melodyDensity, bassAverageMovement, rhythmOnsetsPerQuarter, noteDensity, modulationCount, chordProgression, uniqueChords }`
- Compare Result: `{ reference, own, metrics, sameTopKey, chordSimilarity, note }`
- Personal Trend: `{ count, summaries, trend, note }`
- Counter Melody: `{ melodyTrackId, counterTrackId, motion, gaps, collisions, register, note }`
- Bass Detail: `{ trackId, pedal, movement, approach, note }`
- Drum Detail: `{ categoryCounts, usedGmNotes, fills, averageOnsetsPerBar, note }`
- Part Candidates: `{ candidates: [{ trackId, roleCandidate, confidence, reasons }], note }`
- Visualization Model: `{ bars, tonalTimeline, chordTimeline, melody, bass, rhythm, sections, heatmap, note }`

## Storage Schema
IndexedDB `midi-analyzer` / version 1 / store `savedMidis`
record: storageSchemaVersion, id, savedAt, source, midiBytes, song, warnings

## 重要な復元ポイント
- `chatgpt/v0.1-android-verified-milestone`
- `chatgpt/v0.2-before-structure-motif`
- `chatgpt/v0.2.1-published-milestone`
- `chatgpt/v0.3-feature-complete-milestone`
- `chatgpt/v0.4-published-milestone`
- `chatgpt/v0.4.1-feature-complete-milestone`

最終更新:
2026-10-13
