# AI_HANDOFF.md

現在Version:
`v0.25-dev`

公開中Version:
`v0.25-dev`

最新安定版:
未作成

最終更新: 2026-10-15

## アプリ名
表示名は `MIDI Archive/Analyzer`。

互換性のため以下は変更しない。
- Repository: `tamurayuuki46-cpu/midi-analyzer`
- 公開URL: `https://tamurayuuki46-cpu.github.io/midi-analyzer/`
- package名: `midi-analyzer`
- IndexedDBの既存DB / Store
- SongProject v1

## 最重要の役割
MIDI Archive/Analyzerの役割は2つだけ。

1. **素材を集める・保存する**
2. **曲を理解する**

正式Workflow:
`作曲シート → 必要なら Moises → MIDI Archive/Analyzer → Demo Composer → Arrangement Lab → 必要なら Cubasis → PC DAW（必須）`

正本: `docs/ROLE_BOUNDARY.md`

MoisesをStem分離の主入口とし、Archive/AnalyzerはMoises / RipX / Audio等から受け取った素材を保存・素材化・Audio→MIDI・分析する。Composition / Arrangementの所有者にはならない。

## 初心者導線
### 読み込み前
最初に次の2択を表示する。
1. `MIDIを保存・整理する`
2. `MIDIを解析する`

初心者時はAudio→MIDI / Audio Note Tools / Stem Reference等の詳細ツールを初期状態で隠す。

### 読み込み後
初心者分析を最初に表示する。
- Key
- 音域
- 音の動き
- リズム
- 反復
- 音の役割

各項目は `Metric → Meaning → Action` で表示する。良い / 悪いの採点はしない。Actionは任意の比較案であり、採用を強制しない。

## v0.26-dev Analyzer / Archive 画面分離
案B（`docs/ANALYZER_ARCHIVE_SPLIT_PROPOSAL.md`）の実装。同じPWA・同じDB、画面だけ分離。詳細は `CHANGELOG_v0.26.md`。

- 先頭の切替で `Analyzer` / `Archive`（`#analyzer` / `#archive`）。
- Analyzer主画面は「今見る3つ」= 既存Intent-aware見直し候補の上位最大3件。新しい分析・採点は追加していない。
- Library tabはArchiveへ移動（Clip Library / Key変更 / 保存済みMIDI / Audio→MIDI / Stem）。
- 保存済みMIDIは一覧の「Analyzerで開く」で再解析できる（再保存しない）。
- 判断待ち: Higher-level Metrics tab、Export tab分割。
- 未確認: Android実機。Schema / IndexedDB変更なし。

## v0.22-dev Note Function II
v0.21までのChord Tone / Scale Tone / Passing / Neighbor / Approachを維持し、次を追加済み。
- Resolution candidate
- Strong / Weak beat context
- Suspension candidate
- Anticipation candidate
- Phrase Landing / Degree summary
- Natural / Harmonic / Melodic Minor比較
- Piano Roll可視化

詳細:
- `docs/ANALYSIS_SPEC.md`
- `docs/NOTE_FUNCTION_ANALYSIS.md`

## v0.23-dev Insight Layer
既存AnalyzerのEvidenceをまとめ、初心者が「この曲の特徴として何を見るか」を判断しやすくするRead-only Layer。

主な内容:
- Phrase contour / Peak / Climax候補
- Section Landing比較
- Reference MIDI vs Own MIDI差分説明
- 曲全体の特徴 Top 5

Verse / Chorus等のSection役割は自動確定しない。内部weightは品質Scoreとして公開しない。

詳細:
- `docs/INSIGHT_ANALYSIS_SPEC.md`

## v0.24-dev Diagnostic Loop
v0.23までのEvidenceを、分析後の次の行動へつなげるRead-only / proposal-only Layer。

主な内容:
- Section比較
- `Evidence → Meaning`
- 見直し候補 TOP 3
- Arrangement Lab向けproposal-only handoff
- Compareで修正前 → 修正後の再分析

Analyzerは観測・説明・候補提案まで。Reharmonize / Voicing / 密度・展開変更 / 編曲案生成 / 採用判断はArrangement Labの責務。

詳細:
- `docs/DIAGNOSTIC_LOOP_SPEC.md`

## v0.25-dev Intent-driven Experiment Loop
v0.24を作り直さず、既存Evidenceを「今回の目的に対して何を1項目だけ試すか」へ接続するLayer。develop統合・main公開済み。

フロー:
`目的 → Intent-aware TOP3 → 1項目実験 → Arrangement Lab → Compare再分析 → 採用/見送り記録`

### 目的
- 特徴を確認したい
- Sectionの差を強めたい
- サビ候補を持ち上げたい
- 緊張感・浮遊感を試したい
- 着地・終止感を変えたい
- Climax位置・展開重心を調整したい

目的は既存Evidenceの並び順にだけ使う。品質Score・正解判定に変換しない。

### 1項目実験
各候補は次を持つ。
- `rationale`: なぜ今回の目的に対して比較価値があるか
- `variable`: 今回変える1項目
- `targetSections`
- `keepConstant`: 変えない要素
- `choices`: A/B/C等の比較方向
- `verification`: 修正後に再確認する指標

### Arrangement Lab handoff
互換性を維持する。
- `schemaVersion: 1`
- `type: midi-analyzer-arrangement-handoff`
- `mode: proposal-only`

v0.25ではユーザーが選択したPriority 1件だけを渡す。
追加フィールドは `userIntent / rationale / experiment`。
自動Upload・自動Merge・自動適用はしない。

### 採用 / 見送り履歴
ユーザー明示操作でlocalStorageだけに保存する。
SongProject / IndexedDB Schemaへは入れない。

詳細:
- `docs/INTENT_DIAGNOSTIC_LOOP_SPEC.md`

## 現在実装済み主要機能
### 素材を集める・保存する
- MIDI Import / 保存
- Audio Import
- Basic Pitch Audio→MIDI
- Note Edit / Quantize
- Moises / RipX等のStem Import
- Stem IndexedDB / Solo / Mute / Basic Pitch連携
- Chord / Melody / Bass / Drum / Motif Clip Library
- Clip Tag / Search
- Material Provenance
- Key Transpose / Degree Preserve / 12 Key素材生成
- RipX Bridge
- Analysis / Material Export

### 曲を理解する
- Key / Scale候補
- Chord / Degree / Chord Detail
- Melody / Bass / Rhythm
- Chord Tone / Scale Tone独立分析
- Passing / Neighbor / Approach
- Resolution / Strong-Weak beat context
- Suspension / Anticipation
- Phrase Landing / Degree summary
- Phrase contour / Peak / Climax候補
- Section Landing比較
- 曲全体の特徴 Top 5
- Section比較 / 隣接差分説明
- 分析値のMeaning
- Intent-aware 見直し候補 TOP 3
- 1項目実験 / rationale
- Arrangement Lab proposal-only handoff
- 修正前 / 修正後の再分析
- 採用 / 見送りの端末内履歴
- Natural / Harmonic / Melodic Minor比較
- Piano Roll Note Function可視化
- Motif / Section / 転調
- 裏メロ / Bass / Drum詳細
- Track役割候補
- Visualization / Energy / Section Map / Heatmap
- 2 MIDI比較 / 参考曲 vs 自作曲 / 差分説明Top 5
- Personal Trend
- Explainability / この曲から学べること
- Higher-level Metrics 6種 + Evidence

## Tab順
`overview / harmony / melody / bass / rhythm / structure / visual / compare / library / export / ai / metrics / parts`

Recorderは主Tabから退役済み。

## Storage
### Database `midi-analyzer` / version 3
- `savedMidis`
- `savedClips`
- `savedTakes`（legacy / 保持）

### Database `midi-analyzer-stems` / version 1
- Stem Blob
- optional provenance

### localStorage
- beginner / detail表示設定
- v0.25 diagnostic intent
- v0.25 experiment history

Audio BlobはSongProject JSONへ埋め込まない。

## SongProject
MIDI Archive/Analyzer owner:
- `analysis`
- `reference`

保持する:
- `composition`
- `arrangement`

Demo Composer SchemaやCompositionをArchive/Analyzer都合で変更しない。参考曲をそのまま自作Compositionへ自動変換しない。

## 触らない部分
- `main`を開発用にしない
- 過去Version / 復元Branch / tagを削除・上書きしない
- 元MIDI由来Noteを分析目的で自動変更しない
- `midi-file` raw modelを`src/midi/`外へ漏らさない
- 保存OFF時に元MIDI binaryを永続化しない
- Key / Chord / Section / Motif / 転調 / Track役割を自動確定しない
- Note Function候補を正解として断定しない
- Insight / Diagnostic Loop / Intent Layerを品質Scoreとして扱わない
- Higher-level Metricsを品質Scoreとして扱わない
- Arrangement Labへ候補を自動適用・自動Mergeしない
- 外部AIへ自動送信しない
- Mixer / Mastering / Plugin Hostingを追加しない
- 本格Composition / Arrangement機能を追加しない

## v0.23-dev 統合・公開状態
- 実装PR: `#58`
- 公開PR: `#60`
- 公開main commit: `e0da35b664fb5798378594cbf1606ada36a575c4`
- GitHub Pages Deploy: success

## v0.24-dev 統合・公開状態
- 実装PR: `#65`
- 変更前復元点: `restore/develop-before-diagnostic-loop-v0.24-20261015`
- feature-complete milestone: `chatgpt/v0.24-feature-complete-milestone`
- 公開PR: `#67`
- 公開main commit: `c323d5a3138771a9bffb226ab5d0cdb6ad02791a`
- 公開前main復元点: `restore/main-before-v0.24-publish-20261015`
- Main CI: success
- GitHub Pages Deploy: success
- Schema変更なし

## v0.25-dev 統合・公開状態
- 実装前develop commit: `65667b01adc8c050c18e040c562b3aab40a937a6`
- 変更前復元点: `restore/develop-before-intent-loop-v0.25-20261015`
- feature branch: `chatgpt/midi-analyzer-v0.25-intent-loop`
- final milestone: `chatgpt/v0.25-final-milestone-20261015`
- develop integration PR: `#70`（merged）
- develop merge commit: `b091317d4903318e2cf0ae0ee9b0c6a19815c09c`
- 公開PR: `#72`（merged）
- 公開main commit: `e57e8b013a00b2a4400d1ebbb73b461226f3bf94`
- 公開前main復元点: `restore/main-before-v0.25-publish-20261015`
- feature branch CI #705: success
- PR CI #707: success
- develop integration CI #708 / #713: success
- main CI #716: success
- GitHub Pages Deploy #34: success
- Unit tests: 158 passed / 0 failed
- Production build: success
- Basic Pitch local model assets: success
- Mobile Chromium 360 / 390 / 430px regression: success
- Schema変更なし
- IndexedDB Migrationなし

## Git運用
- `develop`: 開発統合
- `main`: CI合格版かつGitHub Pages公開元
- stable tag: Android実機 + 必要なCubasis/Cubase実機確認後のみ
- developへのpushでは公開しない
- mainへの公開はPR経由
- 過去Branch / Tag / Version / Backupを削除・上書きしない

## 継続確認
- Android実機でv0.25 Structure / intent select / single-variable experiment / Arrangement handoff / historyを確認
- Android共有メニュー / JSON Download fallback
- 4/4 / 6/8実曲でstrong/weak境界確認
- Suspension / Anticipation / Resolution閾値の実曲チューニング
- Moises WAV/MP3/M4A Stem Import
- 長尺Audio / quota / Cancel / retry
- Cubasis / Cubase実機取込

`develop` / `main` / 公開Versionはv0.25-dev。stable tagはAndroid実機確認前に作成しない。
