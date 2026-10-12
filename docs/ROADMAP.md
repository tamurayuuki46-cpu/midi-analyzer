# ROADMAP.md

最終方針: 機能を削るのではなく、全部入りを目標に段階追加する。各Versionで既存解析の回帰を防ぎ、Android-firstを維持する。

## v0.1
- [x] MIDI Import
- [x] Track一覧
- [x] Piano Roll
- [x] Key / Scale候補
- [x] Chord + Degree
- [x] Melody / Bass / Rhythm基本分析
- [x] 保存選択
- [x] Play / Stop
- [x] Android実機確認（Android Chrome: Import / Storage / Playback / Piano Roll / Key / Chord / Basic Analysis）
- [ ] 実MIDIで係数 / heuristic / playback音量調整

## v0.2 — Structure / Motif
- [x] 移調非依存Motif反復候補
- [x] 4小節BlockのSection候補
- [x] 区間Key Timeline
- [x] 転調候補 + 関係表示
- [x] 転回形 / Slash Chord候補
- [x] add9 / 11 / 6・13色付け候補
- [x] Android-first発展分析Panel
- [x] v0.2自動テスト

## v0.3 — Compare / Personal Trend
- [x] 2 MIDI比較
- [x] 参考曲 vs 自作曲比較
- [x] Melody / Chord / Rhythm / Bass / 音域 / 密度 / 転調比較
- [x] 自作MIDI複数保存から作曲傾向集計

## v0.4 — Part Deep Analysis
- [x] 裏メロ分析（反行 / 並行 / 隙間 / 衝突候補）
- [x] Bass詳細分析
- [x] Drum詳細分析 / GM Drum Map / Fill候補
- [x] MIDI内パート分離候補

## v0.5 — Visualization
- [x] Tonal Center Timeline
- [x] Chord Timeline
- [x] Melody / Bass Contour
- [x] Rhythm Density / Energy Curve
- [x] Section Map
- [x] Note / Velocity Heatmap
- [x] Android向けVisual Tab
- [x] v0.5自動テスト

## v0.6 — Clip / Library
- [x] Chord / Melody / Bass / Drum / Motif Clip保存
- [x] 4小節切り出し
- [x] タグ検索
- [x] Chord進行DB / Genre / Mood / BPM / Keyタグ
- [x] IndexedDB v1→v2非破壊Migration
- [x] 保存済みMIDIとClip Libraryの分離表示
- [x] v0.6自動テスト

## v0.7 — Integration / Export
- [ ] Demo Composer Export Adapter
- [ ] JSON / CSV / Markdown Report
- [ ] Chord / Degree text export
- [ ] RipX Bridge Prototype
- [ ] PC → Android転送

## v0.8 — Explanation
- [ ] AI自然言語分析レポート
- [ ] なぜこのKey / Chord / 転調なのか説明
- [ ] 参考曲から学べるポイント
- [ ] 作曲へ応用する候補提案

## v0.9 — Higher-level Metrics
- [ ] 浮遊感候補Score
- [ ] サビらしさ候補Score
- [ ] 驚き度 / 転調Impact
- [ ] 反復と変化のBalance
- [ ] 裏メロ存在感 / 編曲密度
- [ ] 指標の根拠表示と実MIDI検証

## v1.0
- [ ] 全機能統合
- [ ] Android UI最適化
- [ ] 長いMIDIのPerformance最適化
- [ ] 実制作フロー検証
- [ ] Stable化 / main反映候補
