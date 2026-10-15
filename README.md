# MIDI Archive/Analyzer

Androidスマートフォン中心の作曲支援PWAです。

MIDI Archive/Analyzerの役割は次の2つだけです。

1. **素材を集める・保存する**
2. **曲を理解する**

作曲や編曲そのものは担当しません。正式Workflowは次です。

`作曲シート → 必要なら Moises → MIDI Archive/Analyzer → Demo Composer → Arrangement Lab → 必要なら Cubasis → PC DAW（必須）`

詳細: `docs/ROLE_BOUNDARY.md`

## 現在Version

`v0.25-dev`

公開中Version: `v0.24-dev`

公開先: `https://tamurayuuki46-cpu.github.io/midi-analyzer/`

Repository名と公開URLのslugは互換性のため`midi-analyzer`のまま維持します。表示名だけ`MIDI Archive/Analyzer`へ変更しています。

`develop`は開発統合、`main`は自動テスト・build・回帰CI合格版かつGitHub Pages公開元です。stable tagはAndroid実機と必要なCubasis/Cubase実機確認後のみ作成します。

## 初心者モード

アプリを開いた最初の画面で次の2択を表示します。

1. **MIDIを保存・整理する** — 端末保存をONにしてArchiveとして残す。
2. **MIDIを解析する** — 保存せず、その場で特徴を確認することもできる。

初心者時はAudio→MIDI / Note Tools / Stem Referenceなどの詳細ツールを初期状態で隠し、必要な時だけ「詳細ツールを表示」で開きます。

MIDI読み込み後は、Key / 音域 / 音の動き / リズム / 反復に加え、**音の役割**を表示します。各項目を `Metric → Meaning → Action` の順で読み、Meaningは良い / 悪いの採点ではなく特徴の説明、Actionは元案を残したまま試せる任意の実験案です。

## v0.22-dev: Resolution / Landing Analysis

v0.21までのChord Tone / Non-Chord Tone、Scale Tone / Non-Scale Tone、Passing / Neighbor / Approach候補を維持し、v0.22では「緊張がどこへ解決するか」「Chord changeをどうまたぐか」「フレーズがどこへ着地するか」まで分析します。

追加した候補:
- **Resolution** — Chord外音から近い次のChord Toneへの移動
- **Strong / Weak beat context** — musicalBeat基準の発音位置
- **Suspension** — 旧Chord Toneを保持し、新Chord上で一時的にChord外となって近接Chord Toneへ解決する候補
- **Anticipation** — 次Chord ToneをChord切替前に先取りする候補
- **Phrase Landing** — 長めの休符前・曲末等の着地点とDegree / Chord / Scale文脈

Resolutionでは、target pitch / tick、解決までのtick / musicalBeat、半音距離、上行 / 下行、stepwiseかをEvidenceとして保持します。Suspension / AnticipationもChord境界・Duration・時間条件が不足する場合は断定しません。

4/4だけでなく6/8等のcompound meterでは、denominator単位3つを1 musicalBeatとして扱います。

Piano Rollはread-onlyのまま、Chord × Scale色分けに加えてResolution / Suspension / Anticipation候補を輪郭で補助表示します。

詳細: `docs/ANALYSIS_SPEC.md`, `docs/NOTE_FUNCTION_ANALYSIS.md`

## v0.23-dev: Phrase / Section / Compare / Top5 Insight

v0.23では既存Analyzerを作り直さず、そのEvidenceを「曲の特徴として何を見るか」へまとめる**Insight Layer**を追加します。

追加内容:
- **Phrase contour** — arch / valley / ascending / descending / mixed候補
- **Peak note** — Melody最高音と曲内位置
- **Climax candidate** — Pitch / Velocity / 周辺発音密度から候補表示
- **Section Landing比較** — Sectionごとの着地Pitch / Degree / Chord・Scale relation
- **Reference vs Own差分説明** — 数値差の大きい特徴を最大5件、文章で説明
- **曲全体の特徴 Top 5** — Evidence + Meaningを最大5件だけ表示

Insightは品質Scoreではありません。Verse / Chorus等のSection役割も自動確定しません。元MIDI、Normalized Song、SongProject、保存Schemaは変更しません。

詳細: `docs/INSIGHT_ANALYSIS_SPEC.md`

## v0.24-dev: Diagnostic Loop

v0.24では、解析結果を表示して終わらせず、**観測 → 意味 → 次に比較する候補 → 再分析**までつなげます。

追加内容:
- **Section比較** — Note密度 / Melody音域 / Chord Tone率 / 着地Degreeを区間ごとに比較
- **分析値の意味付け** — Evidenceに対して自然言語のMeaningを表示
- **見直し候補 TOP 3** — 差を試した時に違いを確認しやすい観点だけを最大3件に絞る
- **Arrangement Lab handoff** — proposal-only JSONをユーザーの明示操作で共有 / Download
- **修正前 → 修正後の再分析** — Compare Tabで同じ診断指標を再計算して変化を確認

TOP 3は品質・正解・人気の採点ではありません。Analyzerは観測と提案までを担当し、Reharmonize / Voicing / 密度変更 / 編曲案の採用判断はArrangement Labが担当します。

詳細: `docs/DIAGNOSTIC_LOOP_SPEC.md`

## v0.25-dev: Intent-driven Experiment Loop

v0.25では新しい分析項目を増やさず、v0.24のEvidenceを**ユーザーの今回の目的 → TOP 3 → 1項目実験 → Arrangement Lab → 再分析 → 採用/見送り記録**へつなげます。

追加内容:
- **今回の目的** — 特徴確認 / Section差 / サビ候補の持ち上がり / 緊張感・浮遊感 / 着地・終止感 / Climax位置から選択
- **Intent-aware TOP 3** — 同じEvidenceを目的に合わせて並べ替え
- **なぜ候補か** — Evidenceと目的の関係をrationaleで説明
- **1項目実験** — variable / targetSections / keepConstant / A/B/C比較方向 / verificationを表示
- **1候補だけhandoff** — 選んだ実験だけをArrangement Labへproposal-onlyで渡す
- **採用 / 見送り履歴** — localStorageへ端末内記録
- **修正前 → 修正後** — v0.24のCompare再分析をそのまま利用

目的は提案の並び順にだけ使い、品質Scoreや正解判定にはしません。Analyzerは曲を自動変更せず、Arrangement Labの編曲案生成とも責務を分離します。

詳細: `docs/INTENT_DIAGNOSTIC_LOOP_SPEC.md`

## 1. 素材を集める・保存する

- MIDI Import / 端末保存
- Audio Import
- Basic Pitch Audio→MIDI
- 抽出Noteの最小限のEdit / Quantize
- Moises / RipX等の外部分離Stem Import
- Stem保存 / Solo / Mute / Basic Pitch連携
- Chord / Melody / Bass / Drum / Motifの4小節素材Clip
- Clip Library / Tag / Search
- Key Transpose / Degree Preserve / 12 Key素材生成
- RipX Bridge / PC→Android素材受け入れ
- JSON / CSV / Markdown / Chord・Degree Text等のExport

素材ClipとStemには、可能な範囲で出自を記録します。

主な出自:
- 自作
- 参考曲由来
- Moises Stem
- Audio→MIDI
- RipX
- 書籍
- Plugin
- 手入力
- その他

元曲・元Project・生成元などを残し、素材を後から追跡・検索できる方向で統一します。

## 2. 曲を理解する

- Key / Scale候補
- Chord / Degree / Chord Detail
- Melody / Bass / Rhythm分析
- Chord Tone / Non-Chord Tone
- Scale Tone / Non-Scale Tone
- Chord Tone × Scale Toneの関係
- Passing / Neighbor / Approach候補
- Resolution候補 + Evidence
- Strong / Weak musicalBeat context
- Suspension / Anticipation候補
- Phrase Landing / Degree summary
- Phrase contour / Peak / Climax候補
- Section Landing比較
- SectionごとのNote密度 / Melody音域 / Chord Tone率 / 着地Degree比較
- 分析値のMeaning
- 目的に合わせた見直し候補 TOP 3
- 1項目実験 + rationale
- Arrangement Lab向けproposal-only handoff
- 修正前 / 修正後の再分析
- 採用 / 見送りの端末内履歴
- 曲全体の特徴 Top 5
- Natural / Harmonic / Melodic Minor比較
- Piano Roll上の音の役割可視化
- Motif / Section / 区間Key / 転調候補
- 裏メロ分析
- Track役割候補
- Tonal Center / Chord Timeline
- Melody・Bass Contour
- Rhythm Density
- Energy Curve
- Section Map
- Note / Velocity Heatmap
- 2 MIDI比較
- 参考曲 vs 自作曲 + 差分説明Top 5
- Personal Trend
- Explainability / 「この曲から学べること」
- Higher-level Metrics + Evidence
- Metric → Meaning → Action
- Reference Insight → 自分の曲で試す

Higher-level Metrics、Insight、Diagnostic Loop、Intent Layerの優先順位は品質・人気・正解の採点ではありません。理解と比較のための候補値・根拠です。

## Moisesとの役割分担

**Moises = 音源を分ける**

**MIDI Archive/Analyzer = 分けた素材を保存・整理する / 理解する**

MIDI Archive/Analyzer自身をStem分離サービスにはしません。Moises等で書き出したStemを受け取り、保存・試聴・Audio→MIDI・分析へつなぎます。

## 画面構成

読み込み前:
- 初心者スタート: Archive / Analyzeの2択
- 保存済みMIDIを見る
- 詳細ツール表示切替
- MIDI Import

MIDI読み込み直後:
- 初心者モード: Key / 音域 / 音の動き / リズム / 反復 / 音の役割
- 各MetricのMeaning
- 任意のAction
- Reference Insight（抽象特徴のみ）
- 初心者モード / 詳細モード切替

詳細モード:
- 概要: 基本情報 / 簡易再生 / Track一覧 / Piano Roll / 音の役割色分け
- Harmony: Key / Chord / Degree / Chord Detail / Key素材化
- Melody: 主旋律基本分析 / Chord × Scale / Passing・Neighbor・Approach / Resolution・Suspension・Anticipation / Phrase Landing / 裏メロ分析
- Bass: Bass基本分析 / Bass詳細
- Rhythm: Rhythm基本分析 / Drum詳細
- Structure: Motif / Section / Phrase contour / Peak / Climax / Section Landing比較 / 曲全体Top 5 / Section比較 / 分析値の意味 / 目的選択 / Intent-aware TOP3 / 1項目実験 / Arrangement Lab handoff / 採用履歴 / 区間Key / 転調候補
- Visual: Timeline / Contour / Density / Energy / Section Map / Heatmap
- Compare: 2 MIDI比較 / Reference vs Own差分説明 / 修正前→修正後の再分析 / Personal Trend
- Library: 保存済みMIDI + 素材Clip Library / 出自 / タグ検索
- Export: Analysis / Reference / Material Export
- AI: 端末内Explainability / 学べること / AI Prompt Export
- Metrics: 浮遊感 / サビらしさ / 驚き度 / 反復と変化 / 裏メロ存在感 / 編曲密度
- Parts: Track役割候補

詳細タブは横スクロールでき、左右矢印・Home・Endにも対応します。

## Part Recorderの扱い

v0.7で実装したPart Recorderは責務整理で**主UIから退役**しました。既存`savedTakes`は削除せず、IndexedDB Store / Migration /旧コードは互換性のため保持します。

## Demo Composer / Arrangement Labとの役割分担

MIDI Archive/AnalyzerはAnalysis / Reference / Clip / Materialと、ユーザーが明示的に選んだ見直し候補を渡します。

曲そのもののChord / Melody / Bass / Drum / Counter Melodyを作る所有者はDemo Composerです。参考曲を丸ごと自分のCompositionとして扱う導線は縮小し、source typeを明確にします。

Reharmonize / Voicing / 密度・展開変更 / 編曲案A/B/C / 採用判断履歴はArrangement Labの責務です。Analyzerはそれらを自動適用せず、`proposal-only`の候補として渡します。

## 保存方針

- MIDI Import時の端末保存は初期OFF
- 初心者スタートでArchiveを選んだ時だけ端末保存をONにする
- 初心者 / 詳細モードの表示設定はlocalStorageへ端末内保存
- v0.25の目的選択 / Experiment HistoryはlocalStorageへ端末内保存
- Clipは明示保存時のみ
- Stemは明示Import時のみ
- 既存Takeは互換性のため保持
- Audio BlobをSong Project JSONへ直接埋め込まない
- 解析・Explainabilityを外部へ自動送信しない
- Arrangement Lab handoffはユーザー操作時のみ共有 / Downloadし、自動Uploadや自動Mergeをしない

## データ安全性

v0.25でもSchemaを変更しません。
- Normalized Song変更なし
- SongProject v1変更なし
- IndexedDB `midi-analyzer` version 3維持
- Stem DB version 1維持
- 元MIDI由来Noteを分析目的で自動修正しない
- Candidateを自動確定しない
- Insight / Diagnostic Loop / Intent Layerの内部順位を品質Scoreとして公開しない
- Experiment HistoryはlocalStorageのみ
- Arrangement Labへ自動Mergeしない

## 開発

```bash
npm install
npm run dev
npm test
npm run build
```

plain HTML/CSS/JavaScript + Vite。

## 開発開始時に読む順番

1. `README.md`
2. `VERSION`
3. `docs/ROLE_BOUNDARY.md`
4. `docs/AI_HANDOFF.md`
5. `docs/PRODUCT_SPEC.md`
6. `docs/ANALYSIS_SPEC.md`
7. `docs/BEGINNER_MODE.md`
8. `docs/NOTE_FUNCTION_ANALYSIS.md`
9. `docs/INSIGHT_ANALYSIS_SPEC.md`
10. `docs/DIAGNOSTIC_LOOP_SPEC.md`
11. `docs/INTENT_DIAGNOSTIC_LOOP_SPEC.md`
12. `docs/CLIP_LIBRARY_SPEC.md`
13. `docs/STORAGE_SPEC.md`
14. `docs/RELEASE_POLICY.md`

## v0.22復元ポイント

- 変更前develop: `fc29b0613adb5ca826c2fff72487a1423c4658ad`
- Restore branch: `restore/develop-before-resolution-landing-v0.22-20261015`
- Feature branch: `chatgpt/resolution-landing-v0.22`
- PR: `#55`

## v0.23復元ポイント / 公開

- 変更前develop: `e58fcb188e19fe5eced17bc030f2e6cb301d6a3f`
- Restore branch: `restore/develop-before-insight-v0.23-20261015`
- Feature branch: `chatgpt/insight-v0.23`
- Issue: `#57`
- 公開PR: `#60`
- 公開main commit: `e0da35b664fb5798378594cbf1606ada36a575c4`
- 公開前main復元Branch: `restore/main-before-v0.23-publish-20261015`
- GitHub Pages Deploy: success

## v0.24復元ポイント / 公開

- v0.24開発前Restore branch: `restore/develop-before-diagnostic-loop-v0.24-20261015`
- Feature-complete milestone: `chatgpt/v0.24-feature-complete-milestone`
- 公開PR: `#67`
- 公開main commit: `c323d5a3138771a9bffb226ab5d0cdb6ad02791a`
- 公開前main復元Branch: `restore/main-before-v0.24-publish-20261015`
- GitHub Pages Deploy: success

## v0.25復元ポイント / 開発

- 変更前develop: `65667b01adc8c050c18e040c562b3aab40a937a6`
- Restore branch: `restore/develop-before-intent-loop-v0.25-20261015`
- Feature branch: `chatgpt/midi-analyzer-v0.25-intent-loop`
- main / 公開版: `v0.24-dev`のまま変更しない

stable tagはAndroid実機と必要なCubasis/Cubase実機確認後のみ作成します。
