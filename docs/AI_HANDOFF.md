# AI_HANDOFF.md

現在Version:
v0.4.1-dev

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
- v0.4.1: 概要 / Harmony / Melody / Bass / Rhythm / Structure / Compare / Library / AI / PartsのTab UI
- GitHub Actions test + build
- GitHub Pages（develop公開）

## v0.4.1 UI設計
- Analyzerロジック・候補順位・Normalized Songは変更しない
- Import後の解析結果をカテゴリ別Tabへ分離する
- 概要: 基本情報 / Playback / Track一覧 / Piano Roll
- Harmony: Key / Chord / Degree / Chord Detail
- Melody: 主旋律基本分析 / 裏メロ候補
- Bass: Bass基本分析 / Bass詳細
- Rhythm: Rhythm基本分析 / Drum詳細
- Structure: Motif / Section / 区間Key / 転調候補
- Compare: 2 MIDI比較 / Personal Trend
- Library: 保存済みMIDI一覧 / 削除
- AI: 将来用の準備中表示。v0.4.1ではAI解析を自動実行しない
- Parts: Track役割候補
- AndroidではTab列を横スクロール可能にする
- WAI-ARIA tablist / tab / tabpanel、Arrow / Home / End操作に対応

## 次に実施
1. v0.4.1最終CI / Production Build確認
2. Android実機で全Tabのタップ・横スクロール・Library削除確認
3. RipX / Scaler / EZkeys等の実MIDIでv0.1〜v0.4 regression
4. v0.5 Visualizationへ進む

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

## Storage Schema
IndexedDB `midi-analyzer` / version 1 / store `savedMidis`
record: storageSchemaVersion, id, savedAt, source, midiBytes, song, warnings

## 重要な復元ポイント
- `chatgpt/v0.1-android-verified-milestone`
- `chatgpt/v0.2-before-structure-motif`
- `chatgpt/v0.2.1-published-milestone`
- `chatgpt/v0.3-before-compare`
- `chatgpt/v0.3-feature-complete-milestone`
- `chatgpt/v0.4-before-part-deep`
- `chatgpt/v0.4-published-milestone`
- `chatgpt/v0.4-before-tabbed-ui`

最終更新:
2026-10-13
