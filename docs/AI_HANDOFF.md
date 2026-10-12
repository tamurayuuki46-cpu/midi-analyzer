# AI_HANDOFF.md

現在Version:
v0.2-dev

最新安定版:
未作成

現在実装済み:
- MIDI Import / Parser Adapter / Normalized Song Schema
- Tempo / 拍子 / Track / RipX origin / Warning
- IndexedDB端末保存（初期OFF）/ 一覧 / 削除
- 読み取り専用Piano Roll / Track切替 / Zoom / Scroll
- Key / Scale Analyzer / major-minor 24候補 → Top 3 / ユーザー選択
- Chord Analyzer + Degree / Track選択 / Top 3候補
- Melody / Bass / Rhythm基本分析
- Chord選択・Chord Track変更時のMelody / Bass再計算
- 最小Play / Stop簡易再生 / Tempo Map対応Web Audio scheduler
- GitHub Actions unit test + production build
- GitHub Pagesでdevelopを自動公開
- Android Chrome実機Smoke Test済み
- v0.2 Motif反復候補（音程差 + 1/4拍単位onset、移調非依存）
- v0.2 4小節Block Section候補
- v0.2 区間Key Timeline / 転調候補 / Key relation
- v0.2 Chord Detail（転回形 / Slash Chord候補 / add9 / 11 / 6・13色付け候補）
- v0.2発展分析Panel

開発中:
- v0.2 Scopeの最小実装は完了
- 実MIDIでMotif / Section / 転調 / Chord Detailの閾値調整を残す
- v0.1由来のKey / Chord / Basic Analysis / Playback実MIDI調整も継続課題

次に実施:
1. RipX / Scaler / EZkeys等の実MIDIでv0.1/v0.2解析をRegression確認
2. Motifの誤検出、Section similarity 0.82、Chord Detail weight 8%を調整
3. 長いMIDIで発展分析のPerformance / Android表示を確認
4. v0.3で2 MIDI比較 / 参考曲vs自作曲 / 自作曲傾向へ進む

既知の問題:
- SMPTE time division未対応
- Key / Chordの一部係数は暫定
- 保存済みMIDIの「開く」は未実装
- 6/8等のmusicalBeat accent表示は未対応
- PlaybackはGM / 元音色を再現しない簡易Web Audio preview
- Motifは反転 / augmentation / diminution / fuzzy match未対応
- Sectionは固定4小節Blockで可変長境界推定ではない
- 転調は隣接BlockのKey第1候補切替を候補として表示する簡易方式
- pivot chord / common toneによる転調理由推定は未対応
- Slash Chordはv0.2 Chord Detail候補であり、v0.1 Chord選択値そのものは変更しない
- Chord Detail extensionはadd9 / 11 / 6・13のみ
- RipX / Scaler / EZkeys等の実ファイルRegressionは別途必要

触らない部分:
- mainを開発用にしない
- 過去Version / 復元Branch
- Demo Composerのproject.json Schema
- 元MIDI由来Noteを直接変更しない
- `midi-file` raw event modelを `src/midi/` 外へ漏らさない
- 保存OFF時に元MIDI binaryを永続化しない
- AnalyzerがKey / Chord / Section / Motif / 転調を自動確定しない
- v0.1 Chord Analyzerをv0.2 Chord Detailのために破壊的変更しない

最近の重要な設計判断:
- v0.2以降もNormalized Songを解析入力の正本とする
- Motifは絶対Pitchではなく音程差 + quantized onset intervalで比較する
- SectionはPitch Class分布60% / 密度18% / Register14% / Velocity8%のSimilarityを使う
- Section similarity thresholdは0.82の暫定値
- Section / Key Timelineは4小節Blockを基本単位にする
- 区間Keyは既存Key Analyzerを再利用する
- 転調候補は隣接Blockの第1Key候補が変わる位置を表示する
- Chord Detailは既存Chord Analyzerの上位Layerとして実装し、候補順位を変更しない
- Slash Chordは最低音がChord構成音かつRoot以外のときのみ候補表示する
- add9 / 11 / 6・13は区間weight 8%以上を候補表示する
- v0.3以降はROADMAPに従って全部入りを段階追加する

現在のAnalysis Result追加分:
Motif: { trackId, motifs: [{ id, noteLength, signature, occurrenceCount, occurrences, representativePitches }], note, parameters }
Structure: { sections, keyTimeline, modulations, note, parameters }
Harmony Detail: { trackIds, segments: [{ id, startTick, endTick, barNumber, baseCandidate, displayValue, inversion, extensions }], note }

現在のStorage Schema:
IndexedDB `midi-analyzer` / version 1 / store `savedMidis`
record: storageSchemaVersion, id, savedAt, source, midiBytes, song, warnings

復元ポイント:
- `chatgpt/v0.1-before-basic-analysis`
- `chatgpt/v0.1-before-playback`
- `chatgpt/v0.1-before-github-pages`
- `chatgpt/v0.1-before-pages-deploy-fix`
- `chatgpt/v0.1-android-verified-milestone`
- `chatgpt/v0.2-before-structure-motif`

最終更新:
2026-10-13
