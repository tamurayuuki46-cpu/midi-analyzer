# MIDI Archive/Analyzer

Androidスマートフォン中心の作曲支援PWAです。

MIDI Archive/Analyzerの役割は次の2つだけです。

1. **素材を集める・保存する**
2. **曲を理解する**

作曲や編曲そのものは担当しません。正式Workflowは次です。

`作曲シート → 必要なら Moises → MIDI Archive/Analyzer → Demo Composer → Arrangement Lab → 必要なら Cubasis → PC DAW（必須）`

詳細: `docs/ROLE_BOUNDARY.md`

## 現在Version

`v0.18-dev`

公開中Version: `v0.17-dev`

公開先: `https://tamurayuuki46-cpu.github.io/midi-analyzer/`

Repository名と公開URLのslugは互換性のため`midi-analyzer`のまま維持します。表示名だけ`MIDI Archive/Analyzer`へ変更しています。

`develop`は開発統合、`main`は自動テスト・build・回帰CI合格版かつGitHub Pages公開元です。stable tagはAndroid実機と必要なCubasis/Cubase実機確認後のみ作成します。

## 初心者モード

v0.18-devでは、アプリを開いた最初の画面で次の2択を表示します。

1. **MIDIを保存・整理する** — 端末保存をONにしてArchiveとして残す。
2. **MIDIを解析する** — 保存せず、その場で特徴を確認することもできる。

初心者時はAudio→MIDI / Note Tools / Stem Referenceなどの詳細ツールを初期状態で隠し、必要な時だけ「詳細ツールを表示」で開きます。

MIDI読み込み後は、Key / 音域 / 音の動き / リズム / 反復を5項目にまとめ、「良いところ」「改善するとよいところ」「次に試すこと（最大3件）」を表示します。必要になった時だけ詳細モードへ切り替え、従来の13解析タブを使えます。

詳細: `docs/BEGINNER_MODE.md`

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
- 参考曲 vs 自作曲
- Personal Trend
- Explainability / 「この曲から学べること」
- Higher-level Metrics + Evidence

Higher-level Metricsは品質・人気・正解の採点ではありません。理解のための候補値と根拠です。

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
- 初心者モード: Key / 音域 / 音の動き / リズム / 反復
- 良いところ / 改善するとよいところ
- 次に試すこと（最大3件）
- 初心者モード / 詳細モード切替

詳細モード:
- 概要: 基本情報 / 簡易再生 / Track一覧 / Piano Roll
- Harmony: Key / Chord / Degree / Chord Detail / Key素材化
- Melody: 主旋律基本分析 / 裏メロ分析
- Bass: Bass基本分析 / Bass詳細
- Rhythm: Rhythm基本分析 / Drum詳細
- Structure: Motif / Section / 区間Key / 転調候補
- Visual: Timeline / Contour / Density / Energy / Section Map / Heatmap
- Compare: 2 MIDI比較 / Personal Trend
- Library: 保存済みMIDI + 素材Clip Library / 出自 / タグ検索
- Export: Analysis / Reference / Material Export
- AI: 端末内Explainability / 学べること / AI Prompt Export
- Metrics: 浮遊感 / サビらしさ / 驚き度 / 反復と変化 / 裏メロ存在感 / 編曲密度
- Parts: Track役割候補

詳細タブは横スクロールでき、左右矢印・Home・Endにも対応します。

## Part Recorderの扱い

v0.7で実装したPart Recorderは、2026-10-13の責務整理で**主UIから退役**しました。

理由:
- Analyzer内部の簡易Synth Audio録音は「素材を集める / 曲を理解する」の中核ではない
- Moises → Archive/Analyzer → Demo Composerの流れを分断する
- Preview / MIDI Export / DAW側のAudio化と役割が重なる

既存`savedTakes`は削除しません。IndexedDB Store / Migration /旧コードは互換性のため当面保持します。

## Demo Composerとの役割分担

MIDI Archive/AnalyzerはAnalysis / Reference / Clip / Materialを渡します。

曲そのもののChord / Melody / Bass / Drum / Counter Melodyを作る所有者はDemo Composerです。参考曲を丸ごと自分のCompositionとして扱う導線は今後縮小し、source typeを明確にします。

## 保存方針

- MIDI Import時の端末保存は初期OFF
- 初心者スタートでArchiveを選んだ時だけ端末保存をONにする
- 初心者 / 詳細モードの表示設定はlocalStorageへ端末内保存
- Clipは明示保存時のみ
- Stemは明示Import時のみ
- 既存Takeは互換性のため保持
- Audio BlobをSong Project JSONへ直接埋め込まない
- 解析・Explainabilityを外部へ自動送信しない

## 実装済み主要機能

- `.mid` / `.midi` Import / Normalized Song
- 読み込み前の初心者スタート
- 初心者モード / 詳細モード
- 初心者向け5項目要約 / 良いところ / 改善候補 / 次に試すこと
- IndexedDB MIDI保存 / 一覧 / 削除
- Piano Roll / Playback
- Key / Scale / Chord / Degree
- Melody / Bass / Rhythm / Motif / Section分析
- Slash Chord / Chord extension候補
- Compare / Personal Trend
- Visualization
- Clip Library
- 素材Provenance
- Basic Pitch Audio→MIDI
- Note Edit / Quantize
- Key Transpose / Degree Preserve / 12 Key生成
- Stem IndexedDB / Solo / Mute / Basic Pitch連携
- Moises等のStem provenance
- Analysis JSON / CSV / Markdown / Chord-Degree Text Export
- RipX Bridge
- Explainability
- Higher-level Metrics
- SongProject v1 Adapter
- GitHub Actions CI / GitHub Pages

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
8. `docs/CLIP_LIBRARY_SPEC.md`
9. `docs/STORAGE_SPEC.md`
10. `docs/INTEGRATION_EXPORT_SPEC.md`
11. `docs/ROADMAP.md`
12. `CHANGELOG_v0.18.md`

重要仕様は`docs/`を正本とします。

## v0.18-dev Scope

- 表示名をMIDI Archive/Analyzerへ変更
- 最初の画面をArchive / Analyzeの2択にする
- 詳細ツールを初心者時は隠す
- MIDI読み込み後の初心者モードを主導線にする
- Key / 音域 / 音の動き / リズム / 反復を5項目へ要約
- 良いところ / 改善するとよいところ / 次に試すこと最大3件を表示
- 詳細13タブを削除せず、詳細モードとして保持
- SongProject v1 / IndexedDB v3 / Clip / Stem / Memoとの互換性を維持
- 360 / 390 / 430pxのChromium回帰をCIで継続する

Android実機のタッチ操作、PWA再起動後のモード保持、長尺Audio、Stem保存、Audio形式は継続確認対象です。
