# AI_HANDOFF.md

現在Version:
v0.7-dev

公開中Version:
v0.6-dev

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
- v0.6: Chord / Melody / Bass / Drum / Motifの4小節Clip Library、Tag Search、Chord progression context
- v0.7: Recorder Tab / Part別Audio録音 / Take保存 / A/B / Audio書き出し
- IndexedDB v3: `savedMidis` + `savedClips` + `savedTakes`
- GitHub Actions test + build
- GitHub Pages（develop公開）

## v0.7 Part Recording設計
- Recorder TabはImport後に既存Tab DOMへ安全に挿入する
- Part Type: melody / chord / bass / drum
- roleHintを既定Track選択へ利用し、ユーザーはTrackを手動変更できる
- Melody fallbackは平均Pitch最高、Bass fallbackは平均Pitch最低
- DrumはisDrumsまたはChannel 10を優先
- 選択TrackだけをPart Songへfilterし、元Songは変更しない
- 既存Playbackと同系統のtriangle / square click簡易音源を録音する
- Web Audio `MediaStreamDestination` → MediaRecorderで録音する
- Monitor OFFではMediaRecorderへ出力しつつspeakerへ接続しない
- MediaRecorder mimeTypeはWebM/Opus → WebM → MP4の順に対応形式を選ぶ
- TakeはPreview / A/B / Audio書き出し / 削除に対応
- 再Import時はRecorder Controllerをdestroyする
- 他アプリ内部Audio / マイク入力 / WAV固定rendererはScope外

## IndexedDB v3 Migration
Database: `midi-analyzer`
Version: `3`

Stores:
- `savedMidis` — v0.1から継続。元MIDI + Normalized Song
- `savedClips` — v0.6追加。Clip Library
- `savedTakes` — v0.7追加。録音Audio Take

v1/v2→v3では既存`savedMidis` / `savedClips` Store / recordを削除・変換しない。
Upgrade時に`savedTakes`だけ追加する。
Migrationを`fake-indexeddb`で自動テストする。

## 次に実施
1. Android Chrome実機でMediaRecorder / Audio書き出し確認
2. v0.7残りのIntegration / Export
3. Demo Composer Export Adapter
4. JSON / CSV / Markdown Report
5. Chord / Degree text export
6. RipX Bridge Prototype / PC→Android転送の設計
7. RipX / Scaler / EZkeys等の実MIDI regression

## 既知の問題 / 継続課題
- SMPTE time division未対応
- Key / Chord / Section / Motif / Part Deepの一部閾値は暫定
- 保存済みMIDIの「開く」は未実装
- Playback / RecorderはGM / 元音色を再現しない簡易音源
- Sectionは固定4小節Block
- pivot chord / common tone転調理由は未対応
- CompareのTrack手動対応 / Section同期比較は未対応
- 裏メロTrackの手動指定UIは未対応
- Fill候補はrule-based簡易判定
- AI Tabはplaceholderのみで説明機能本体は未実装
- Visual Heatmapは先頭16小節表示
- Clip編集 / MIDI書き出しは未対応
- RecorderのMediaRecorder形式はブラウザ依存
- WAV固定renderer / マイク / 外部Audio input / 同時Multi Stem録音は未対応
- Clip / Take Cloud同期 / Demo Composer送信は未対応
- 実ファイルRegressionは継続必要

## 触らない部分
- mainを開発用にしない
- 過去Version / 復元Branchを削除・上書きしない
- Demo Composer project.json Schema
- 元MIDI由来Noteを自動変更しない
- `midi-file` raw event modelを `src/midi/` 外へ漏らさない
- 保存OFF時に元MIDI binaryを永続化しない
- AnalyzerがKey / Chord / Section / Motif / 転調 / Track役割を自動確定しない
- Migrationで`savedMidis` / `savedClips` recordを破壊しない

## Analysis / Library Result追加分
- Compare Summary: `{ name, key, bpm, melodyRange, melodyDensity, bassAverageMovement, rhythmOnsetsPerQuarter, noteDensity, modulationCount, chordProgression, uniqueChords }`
- Compare Result: `{ reference, own, metrics, sameTopKey, chordSimilarity, note }`
- Personal Trend: `{ count, summaries, trend, note }`
- Counter Melody: `{ melodyTrackId, counterTrackId, motion, gaps, collisions, register, note }`
- Bass Detail: `{ trackId, pedal, movement, approach, note }`
- Drum Detail: `{ categoryCounts, usedGmNotes, fills, averageOnsetsPerBar, note }`
- Part Candidates: `{ candidates: [{ trackId, roleCandidate, confidence, reasons }], note }`
- Visualization Model: `{ bars, tonalTimeline, chordTimeline, melody, bass, rhythm, sections, heatmap, note }`
- Clip Record: `{ clipSchemaVersion, id, savedAt, type, name, source, range, ppq, trackIds, notes, chordProgression, motifs, tags }`
- Take Record: `{ takeSchemaVersion, id, savedAt, name, partType, trackIds, source, mimeType, durationSeconds, eventCount, audioBytes }`

## Storage Schema
IndexedDB `midi-analyzer` / version 3

`savedMidis` record:
`storageSchemaVersion, id, savedAt, source, midiBytes, song, warnings`

`savedClips` record:
`clipSchemaVersion, id, savedAt, type, name, source, range, ppq, trackIds, notes, chordProgression, motifs, tags`

`savedTakes` record:
`takeSchemaVersion, id, savedAt, name, partType, trackIds, source, mimeType, durationSeconds, eventCount, audioBytes`

## 重要な復元ポイント
- `chatgpt/v0.1-android-verified-milestone`
- `chatgpt/v0.2-before-structure-motif`
- `chatgpt/v0.2.1-published-milestone`
- `chatgpt/v0.3-feature-complete-milestone`
- `chatgpt/v0.4-published-milestone`
- `chatgpt/v0.4.1-feature-complete-milestone`
- `chatgpt/v0.5-feature-complete-milestone`
- `chatgpt/v0.6-published-milestone`
- `chatgpt/v0.6-before-part-recorder`

最終更新:
2026-10-13
