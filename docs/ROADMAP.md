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
- [ ] 実MIDIで係数 / heuristic / playback音量調整（検証・チューニング項目）

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

## v0.7 — Part Recording / Integration / Export
- [x] Recorder Tab
- [x] Melody / Chord / Bass / DrumのPart別Track候補
- [x] Track手動選択
- [x] Web Audio → MediaRecorderによる分離Audio録音
- [x] 録音中Monitor ON/OFF
- [x] Take端末保存 / 再生 / 削除
- [x] Take A/B比較
- [x] Browser対応Audio形式で書き出し
- [x] IndexedDB v2→v3非破壊Migration / savedTakes追加
- [x] Demo Composer Schema 3 Export Adapter
- [x] JSON / CSV / Markdown Report
- [x] Chord / Degree text export
- [x] Android共有メニューへのDemo Composer project.json受け渡し
- [x] RipX Bridge Prototype（PC上の指定MIDIをLAN配信）
- [x] PC → Android転送（BridgeページからMIDI Download → Analyzer起動）
- [ ] Android実機でMediaRecorder / Audio書き出し / Bridge最終確認（実機検証項目）

## v0.8 — Explanation
- [x] 端末内自然言語Explainability Report
- [x] なぜこのKey / Chord / 転調候補なのか説明
- [x] 「この曲から学べること」
- [x] 作曲へ応用する候補提案
- [x] 外部AIへ渡すPrompt packageの明示Export
- [x] 外部AIへ自動送信しないPrivacy設計

## v0.9 — Higher-level Metrics
- [x] 浮遊感候補Score
- [x] サビらしさ候補Score / Section ranking
- [x] 驚き度 / 転調Impact候補
- [x] 反復と変化のBalance候補
- [x] 裏メロ存在感候補
- [x] 編曲密度候補
- [x] 全Scoreの根拠表示
- [x] 0〜100の候補Scoreとして意味を固定し、品質評価にしない
- [ ] 実MIDIでの閾値検証・係数チューニング（検証項目）

## v1.0
- [ ] 全機能統合
- [ ] Android UI最適化
- [ ] 長いMIDIのPerformance最適化
- [ ] 実制作フロー検証
- [ ] Stable化 / main反映候補
