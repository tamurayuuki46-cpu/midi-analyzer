# AI_HANDOFF.md

現在Version:
`v0.23-dev`

公開中Version:
`v0.23-dev`

最新安定版:
未作成

最終更新: 2026-10-15

## アプリ名
表示名は `MIDI Archive/Analyzer`。

互換性のため以下は変更しない。
- Repository: `tamurayuuki46-cpu/midi-analyzer`
- 公開URL: `https://tamurayuuki46-cpu.github.io/midi-analyzer/`
- package名: `midi-analyzer`
- IndexedDB / localStorageの既存キー

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

## v0.22-dev Note Function II
v0.21のChord Tone / Scale Tone / Passing / Neighbor / Approachを維持し、次を追加済み。

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
既存AnalyzerのEvidenceをまとめ、初心者が「この曲の特徴として何を見るか」を判断しやすくするRead-only Insight Layer。

### Phrase contour / Peak / Climax
- contour: arch / valley / ascending / descending / mixed
- Melody最高音 / 最低音
- 曲内位置
- 方向転換回数
- Pitch / Velocity / 周辺発音密度によるClimax候補

Climaxは候補であり、曲の品質や本当の盛り上がり位置を断定しない。

### Section Landing比較
既存Structure Section候補ごとの最後の代表Melody Noteを比較する。

Evidence:
- Pitch / Pitch name
- Key Degree
- Chord Tone / Scale Tone
- Chord候補
- strong / weak beat

A/B/C等のSection候補をVerse / Chorus等へ自動確定しない。

### Reference MIDI vs Own MIDI差分説明
既存Compare数値から差が大きい特徴を最大5件だけ説明する。

対象例:
- Melody音域 / 密度 / 平均跳躍
- Bass移動 / Root率
- Rhythm密度 / 拍頭率
- 全体Note密度
- 転調候補数
- Top Key
- Chord集合共通度

差分説明は観測であり、参考曲へ近づけるべきという指示や優劣評価には変換しない。

### 曲全体の特徴 Top 5
既存Evidenceから最大5件だけ選び、`Feature → Evidence → Meaning`で表示する。

候補:
- 最高音位置 / 音域
- Phrase contour
- Section landing
- Resolution傾向
- Section密度差
- 転調候補
- Chord Tone率

内部weightは候補順位用であり、品質Scoreとして公開しない。

詳細:
- `docs/INSIGHT_ANALYSIS_SPEC.md`

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
- Insightを品質Scoreとして扱わない
- Higher-level Metricsを品質Scoreとして扱わない
- 外部AIへ自動送信しない
- Mixer / Mastering / Plugin Hostingを追加しない
- 本格Composition / Arrangement機能を追加しない

## v0.22-dev 統合状態
- 実装PR: `#55`（developへ統合済み）
- Issue: `#54`（完了）
- 変更前復元点: `restore/develop-before-resolution-landing-v0.22-20261015`
- v0.22統合commit: `6224947576ec3e925adb7c8881b0bbe02c41b3a7`
- feature-complete milestone: `chatgpt/v0.22-feature-complete-milestone`

## v0.23-dev 統合・公開状態
- Issue: `#57`（完了）
- 実装PR: `#58`（developへ統合済み）
- 実装前develop commit: `e58fcb188e19fe5eced17bc030f2e6cb301d6a3f`
- 変更前復元点: `restore/develop-before-insight-v0.23-20261015`
- v0.23統合commit: `41a6b0e53725aaf39fd67d4ad2085986cb00cbff`
- feature-complete milestone: `chatgpt/v0.23-feature-complete-milestone`
- 公開PR: `#60`
- 公開main commit: `e0da35b664fb5798378594cbf1606ada36a575c4`
- 公開前main復元点: `restore/main-before-v0.23-publish-20261015`
- GitHub Pages Deploy: success
- Schema変更なし

自動検証:
- PR #58 Unit tests: success
- Production build: success
- Basic Pitch local model assets: success
- Mobile Chromium 360 / 390 / 430px regression: success
- Structure v0.23 Insight表示: success
- 統合後develop CI: success
- 公開PR #60 CI: success
- 公開main CI: success
- GitHub Pages build / deploy: success

## Git運用
- `develop`: 開発統合
- `main`: CI合格版かつGitHub Pages公開元
- stable tag: Android実機 + 必要なCubasis/Cubase実機確認後のみ
- developへのpushでは公開しない
- mainへの公開はPR経由
- 過去Branch / Tag / Version / Backupを削除・上書きしない

## 次の開発候補
- Appoggiatura / Escape Tone / Retardation候補
- Climax候補の実曲チューニング
- Section名をユーザー確定した後のVerse / Bメロ / Chorus比較
- Reference Insightへ解決速度 / 解決方向を抽象特徴として追加

## 継続確認
- Android実機でv0.23 Structure / Compare表示とタッチ操作
- 4/4 / 6/8実曲でstrong/weak境界確認
- Suspension / Anticipation / Resolution閾値の実曲チューニング
- PWA再起動後の表示設定
- Moises WAV/MP3/M4A Stem Import
- 長尺Audio / quota / Cancel / retry
- Clip v1 / v2混在Library
- Cubasis / Cubase実機取込

`main` / 公開Versionはv0.23-dev。stable tagはAndroid実機確認前に作成しない。