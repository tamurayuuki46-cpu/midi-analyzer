# MIDI Analyzer

Androidスマートフォン中心の作曲支援PWAです。

MIDI Analyzerの役割は次の2つだけです。

1. **素材を集める**
2. **曲を理解する**

作曲や編曲そのものは担当しません。正式Workflowは次です。

`作曲シート → 必要なら Moises → MIDI Analyzer → Demo Composer → Arrangement Lab → 必要なら Cubasis → PC DAW（必須）`

詳細: `docs/ROLE_BOUNDARY.md`

## 現在Version

`v0.12-dev`

公開中Version: `v0.11-dev`

公開先: `https://tamurayuuki46-cpu.github.io/midi-analyzer/`

`develop`は開発統合、`main`は自動テスト・build・回帰CI合格版かつGitHub Pages公開元です。stable tagはAndroid実機と必要なCubasis/Cubase実機確認後のみ作成します。

## 1. 素材を集める

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

**MIDI Analyzer = 分けた素材を集める・理解する**

MIDI Analyzer自身をStem分離サービスにはしません。Moises等で書き出したStemを受け取り、保存・試聴・Audio→MIDI・分析へつなぎます。

## 画面構成

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

タブは横スクロールでき、左右矢印・Home・Endにも対応します。

## Part Recorderの扱い

v0.7で実装したPart Recorderは、2026-10-13の責務整理で**主UIから退役**しました。

理由:
- Analyzer内部の簡易Synth Audio録音は「素材を集める / 曲を理解する」の中核ではない
- Moises → Analyzer → Demo Composerの流れを分断する
- Preview / MIDI Export / DAW側のAudio化と役割が重なる

既存`savedTakes`は削除しません。IndexedDB Store / Migration /旧コードは互換性のため当面保持します。

## Demo Composerとの役割分担

MIDI AnalyzerはAnalysis / Reference / Clip / Materialを渡します。

曲そのもののChord / Melody / Bass / Drum / Counter Melodyを作る所有者はDemo Composerです。参考曲を丸ごと自分のCompositionとして扱う導線は今後縮小し、source typeを明確にします。

## 保存方針

- MIDI Import時の端末保存は初期OFF
- Clipは明示保存時のみ
- Stemは明示Import時のみ
- 既存Takeは互換性のため保持
- Audio BlobをSong Project JSONへ直接埋め込まない
- 解析・Explainabilityを外部へ自動送信しない

## 実装済み主要機能

- `.mid` / `.midi` Import / Normalized Song
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
7. `docs/CLIP_LIBRARY_SPEC.md`
8. `docs/STORAGE_SPEC.md`
9. `docs/INTEGRATION_EXPORT_SPEC.md`
10. `docs/ROADMAP.md`
11. `CHANGELOG.md`

重要仕様は`docs/`を正本とします。

## v0.12-dev Scope

- Analyzer責務を「素材を集める / 曲を理解する」へ固定
- Part Recorderを主UIから退役（既存Take dataは保持）
- Clip素材のProvenance追加
- Moises / RipX / Audio→MIDI等の素材出自を検索可能化
- Stem provenance追加
- MoisesをStem分離の主入口として位置付け
- 既存v1 Clip / Take / MIDI / Stemとの互換性を維持

Android実機の長尺Audio、Stem保存、Audio形式、360/390/430px主要導線は継続確認対象です。
