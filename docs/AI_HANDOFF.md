# AI_HANDOFF.md

現在Version:
`v0.11-dev`

公開中Version:
`v0.11-dev`

最新安定版:
未作成

## 現在実装済み
- v0.1 Import / Storage / Piano Roll / Key / Chord / Melody / Bass / Rhythm / Playback
- v0.2 Motif / 4小節Section / 区間Key / 転調 / Slash / Chord Detail
- v0.2.1 Top 1仮コード進行
- v0.3 2 MIDI比較 / 参考曲 vs 自作曲 / Personal Trend
- v0.4 裏メロ / Bass詳細 / Drum詳細 / Track役割候補
- v0.4.1 カテゴリ別Tab UI
- v0.5 Visualization / Energy Curve / Section Map / Heatmap
- v0.6 4小節Clip Library / Tag Search / Chord context DB
- v0.7 Recorder / Take Library / Demo Composer連携 / Export / RipX Bridge
- v0.8 端末内Explainability / この曲から学べること / AI Prompt Export
- v0.9 Higher-level Metrics 6種 + Evidence
- IndexedDB v3: `savedMidis` + `savedClips` + `savedTakes`
- GitHub Actions unit / production build / Basic Pitch model検証。GitHub Pagesはmain公開。

## v0.7 Integration / Export
- `buildAnalysisBundle`をExport / Explainability / Metricsの共通入力にする
- Export: JSON / CSV / Markdown / Chord-Degree Text
- Demo Composer `project.json` Schema 3 Adapter
- Demo Composer現行制約: PPQ 480 / 4/4
- 元PPQは480へ比例変換
- Analyzer flat key表記はDemo Composerのsharp表記へPitch Class維持で変換
- A/B/C Section候補をVerse / Chorusへ自動確定しない
- 対応Androidでは`navigator.share`でproject.jsonを共有可能
- RipX Bridge: PC指定MIDIを同一LANのAndroidへDownloadするNode Prototype

## v0.8 Explainability
- 外部LLMを自動実行しない
- 既存Analyzerの候補とEvidenceを端末内で文章化する
- Why Key / Chord / Modulation
- この曲から学べること
- 作曲への応用候補
- 必要な場合だけ外部AI用PromptをFile Export
- MIDI / Analysisの自動Uploadなし

## v0.9 Higher-level Metrics
0〜100の候補Score:
- Floating
- Chorus-likeness + Section ranking
- Surprise / Modulation Impact
- Repetition vs Variation balance
- Counter Melody presence
- Arrangement density

全Scoreは品質・人気・正解の採点ではなく、Evidenceを併記する。

## Tab順
`overview / harmony / melody / bass / rhythm / structure / visual / compare / library / recorder / export / ai / metrics / parts`

## Storage
Database: `midi-analyzer` / version 3

- `savedMidis`: 元MIDI + Normalized Song
- `savedClips`: Clip Library
- `savedTakes`: Recorder Audio Take

v1/v2→v3は既存recordを破壊しない。

## 次に実施
機能実装として残すのはv1.0のみ。

v1.0:
1. 全機能統合 / 情報設計整理
2. Android UI最適化
3. 長いMIDIのPerformance最適化
4. 実制作フロー検証
5. Stable化 / main候補

実装とは別の継続検証:
- Android実機でRecorder / Export / Bridge
- Demo Composer実アプリへのproject.json Import
- RipX / Scaler / EZkeys等の実MIDI regression
- v0.9 Metric係数・閾値 tuning

## 既知の制約
- SMPTE time division未対応
- Sectionは固定4小節Block
- pivot chord / common tone転調理由の完全推定なし
- CompareのTrack手動対応 / Section同期比較なし
- Voice Leadingの完全和声学判定なし
- Visual Heatmapは先頭16小節
- Recorder出力形式はMediaRecorder / Browser依存
- WAV固定 / Mic / 他アプリ内部Audio直接録音 / 同時Multi StemはScope外
- RipX Bridgeは同一LAN用Prototypeで認証/TLSなし
- Explainabilityは外部生成AIではなくlocal rule-based explanation

## 触らない部分
- `main`を開発用にしない
- 過去Version / 復元Branchを削除・上書きしない
- Demo ComposerのSchema定義をMIDI Analyzer側都合で変更しない
- 元MIDI由来Noteを自動変更しない
- `midi-file` raw event modelを`src/midi/`外へ漏らさない
- 保存OFF時に元MIDI binaryを永続化しない
- AnalyzerがKey / Chord / Section / Motif / 転調 / Track役割を自動確定しない
- Higher-level Metricを品質Scoreとして扱わない
- 外部AIへ自動送信しない

## 主要追加Result
- Analysis Bundle: `{ source, song, key, chords, topChordProgression, melody, bass, rhythm, motif, structure, deep }`
- Explanation: `{ engine, generatedLocally, overview, whyKey, harmony, modulation, learnings, applications, metrics, note }`
- Metrics: `{ metrics, chorusCandidates, note }`
- Demo Composer Export: `{ project, warnings }`

## 重要な復元ポイント
- `chatgpt/v0.1-android-verified-milestone`
- `chatgpt/v0.2.1-published-milestone`
- `chatgpt/v0.3-feature-complete-milestone`
- `chatgpt/v0.4-published-milestone`
- `chatgpt/v0.5-feature-complete-milestone`
- `chatgpt/v0.6-published-milestone`
- `chatgpt/v0.7-published-milestone`
- `chatgpt/v0.7-before-integration-export`
- `chatgpt/v0.9-feature-complete-milestone`
- `chatgpt/v0.9-published-milestone`

最終更新: 2026-10-13

## 2026-10-13 現在の統合状態

- PR #19でGit運用変更をdevelopへ統合、PR #20でv0.11-devをmainへ統合済み。
- PR #21でmain CI gate、PR #22/#23でPages公開元をmainへ変更。developへのpushでは公開しない。
- `develop`は開発統合、`main`は自動テスト・build・回帰CI合格版、GitHub Pages公開元。stable tagはAndroid実機と必要なCubasis/Cubase実機確認後のみ作成します。
- SongProject v1 Adapter / analysisとreferenceのownership保護、Basic Pitch Audio→MIDI / Progress / Cancel / chunk / Note Edit / Quantize。
- Key Transpose / Degree Preserve / 12 Key / 一般MIDI Key変更 / SongProject Key整合 / Channel 10 Drums移調除外。
- Stem Blobは専用IndexedDBに保存。Solo / Mute / Basic Pitch入力 / reference.items metadata同期。Project Homeを実装。
- Android実機、WAV/MP3/M4A、長尺Audioメモリ/Cancel/再試行、Stem quota、Cubasis/Cubase実機取込は未確認。stable tag未作成。

## Cloud Browser回帰修正 v0.11-dev
公開v0.10で短いWAVの変換は完了したが、正規化のorigin許可漏れで解析へ渡せなかった。basic-pitchを許可し、Noteの出所を保持する統合回帰を追加。DB変更なし。

公開v0.11でCloud Browserの短いWAV→Basic Pitch→既存解析、Quantize再取込、変換MIDI保存が成功。全14解析タブ・MIDI保存・移調・Stem保存/Solo/Mute、Demo↔Arrangement往復も確認。スマホ幅は別CIで検証し、実機確認とは区別する。
