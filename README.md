# MIDI Analyzer

Androidスマートフォン中心の作曲支援PWA。MIDIを読み込み、Key / Chord / Melody / Bass / Rhythm / Motif / Section / 転調 / 比較 / パート詳細 / 可視化 / Clip Library / Part Recording / Export / Explainability / Higher-level Metricsを作曲判断へ応用するためのアプリです。

## 現在Version
`v0.10-dev`

公開中Version: `v0.10-dev`

公開先: `https://tamurayuuki46-cpu.github.io/midi-analyzer/`

`develop`は開発統合、`main`は自動テスト・build・回帰CI合格版、GitHub Pages公開元。stable tagはAndroid実機と必要なCubasis/Cubase実機確認後のみ作成します。 mainへの統合後にUnit Test → Production Build → GitHub Pages Deployを自動実行します。

## 画面構成
Import後の解析結果は、Androidで1画面が長くなりすぎないようカテゴリ別タブに分けています。

- 概要: 基本情報 / 簡易再生 / Track一覧 / Piano Roll
- Harmony: Key / Chord / Degree / Chord Detail
- Melody: 主旋律基本分析 / 裏メロ候補
- Bass: Bass基本分析 / Bass詳細
- Rhythm: Rhythm基本分析 / Drum詳細
- Structure: Motif / Section / 区間Key / 転調候補
- Visual: Tonal Center / Chord Timeline / Melody・Bass Contour / Rhythm Density / Energy Curve / Section Map / Heatmap
- Compare: 2 MIDI比較 / Personal Trend
- Library: 保存済みMIDI + 4小節Clip Library / タグ検索
- Recorder: Melody / Chord / Bass / Drumの分離Audio録音 / Take保存 / A/B / Audio書き出し
- Export: Demo Composer project.json / JSON / CSV / Markdown / Chord・Degree Text
- AI: 端末内Explainability / 「この曲から学べること」 / 作曲への応用候補 / AI Prompt Export
- Metrics: 浮遊感 / サビらしさ / 驚き度 / 反復と変化 / 裏メロ存在感 / 編曲密度
- Parts: Track役割候補

タブは横スクロール可能で、クリック/タップに加えてキーボードの左右矢印・Home・Endでも移動できます。

## 実装済み
- `.mid` / `.midi` Import / `midi-file` Adapter / Normalized Song
- Tempo / 拍子 / Track一覧 / RipX origin / Warning
- IndexedDB任意保存 / 一覧 / 削除
- 読み取り専用Piano Roll
- Key / Scale Top 3 + ユーザー選択
- Chord Top 3 + Track選択 + Degree
- 各Chord区間ランキング1位の仮コード進行
- Melody / Bass / Rhythm基本分析
- Play / Stop簡易再生
- Motif反復 / 4小節Section / 区間Key / 転調候補
- Slash Chord / add9・11・6/13色付け候補
- 2 MIDI比較 / 参考曲 vs 自作曲
- 保存済みMIDIからPersonal Trend集計
- 裏メロ候補の反行 / 並行 / 斜行 / 隙間 / 2度衝突候補
- Bass詳細 / Drum詳細 / MIDI Track役割候補
- Tonal Center Timeline / Chord Timeline / Melody・Bass Contour
- Rhythm Density / Energy Curve / Section Map / Note・Velocity Heatmap
- Chord / Melody / Bass / Drum / Motifの4小節Clip保存 / タグ検索
- Melody / Chord / Bass / DrumのPart別Audio録音
- Take保存 / Preview / A/B比較 / Audio書き出し / 削除
- Demo Composer Schema 3 Export Adapter
- JSON / CSV / Markdown Report / Chord・Degree Text Export
- Android共有メニューへのDemo Composer project.json受け渡し
- RipX Bridge Prototype / PC→Android LAN転送
- 端末内Explainability Report / 「この曲から学べること」
- 外部AI用Prompt package Export（自動送信なし）
- v0.9 Higher-level candidate Metrics 6種 + Evidence
- IndexedDB v3 migration（既存`savedMidis` / `savedClips`を維持して`savedTakes`追加）
- GitHub Actions CI / GitHub Pages

## v0.7 Integration / Export
Export Tabから以下を書き出せます。

- MIDI Analyzer Analysis JSON
- CSV
- Markdown Report
- Chord / Degree Text
- Demo Composer `project.json` Schema 3互換JSON

Demo Composer変換では元MIDIのPPQを480へ比例変換します。現行Demo Composerが4/4固定のため、4/4以外はWarningを表示します。Section候補はVerse / Chorusへ勝手に確定しません。

RipX BridgeはPCで次のように実行します。

```bash
npm run bridge -- "C:\\path\\to\\song.mid"
```

同じWi-Fi / LAN上のAndroidから表示されたURLを開き、MIDIをDownloadしてMIDI Analyzerへ取り込めます。

詳細: `docs/INTEGRATION_EXPORT_SPEC.md` / `docs/RIPX_BRIDGE_SPEC.md`

## v0.8 Explainability
AI Tabは外部AIへ自動送信せず、既存Analyzerの候補・根拠を端末内で自然言語化します。

- なぜこのKey候補か
- Chord進行をどう読むか
- 転調候補をどう読むか
- この曲から学べること
- 作曲へ応用する候補

外部AIを使いたい場合だけ、解析候補をまとめたPrompt fileを明示操作で保存できます。

詳細: `docs/EXPLANATION_SPEC.md`

## v0.9 Higher-level Metrics
以下を0〜100の候補Scoreとして表示します。

- 浮遊感候補
- サビらしさ候補 / Section ranking
- 驚き度 / 転調Impact候補
- 反復と変化のBalance候補
- 裏メロ存在感候補
- 編曲密度候補

Scoreは品質・人気・正解の採点ではありません。すべてEvidenceを表示します。

詳細: `docs/HIGHER_METRICS_SPEC.md`

## 保存方針
「この端末に保存する」は初期OFFです。ONの場合のみ元MIDIと正規化結果を端末内IndexedDBへ保存します。ClipはLibraryで明示保存した時だけ、TakeはRecorderで録音した時だけ保存します。解析・Explainabilityは外部サービスへ自動送信しません。

## 開発
```bash
npm install
npm run dev
npm test
npm run build
```

plain HTML/CSS/JavaScript + Vite。React等のFrameworkは導入していません。

## Version Scope
- v0.1: Import / Storage / Piano Roll / Key / Chord / Melody / Bass / Rhythm / Playback
- v0.2: Motif / Section / 区間Key / 転調 / Chord Detail
- v0.2.1: Chordランキング1位の仮コード進行
- v0.3: 2 MIDI比較 / Personal Trend
- v0.4: 裏メロ / Bass / Drum / Track役割の詳細分析
- v0.4.1: 解析結果をカテゴリ別Tabへ分割
- v0.5: Visualization
- v0.6: 4小節Clip / Library / Tag Search / Chord進行DB
- v0.7: Part Recording + Demo Composer Integration / Export + RipX Bridge
- v0.8: Explainability / 「この曲から学べること」
- v0.9: Higher-level Metrics
- v1.0: 統合 / Android UI最適化 / Performance / Stable化

詳細は `docs/ROADMAP.md`。

## 開発開始時に読む順番
1. `README.md`
2. `VERSION`
3. `docs/AI_HANDOFF.md`
4. `docs/PRODUCT_SPEC.md`
5. `docs/ANALYSIS_SPEC.md`
6. `docs/INTEGRATION_EXPORT_SPEC.md`
7. `docs/EXPLANATION_SPEC.md`
8. `docs/HIGHER_METRICS_SPEC.md`
9. `docs/RIPX_BRIDGE_SPEC.md`
10. `docs/STORAGE_SPEC.md`
11. `docs/MIDI_SCHEMA.md`
12. `docs/ARCHITECTURE.md`
13. `docs/ROADMAP.md`
14. `CHANGELOG.md`

重要仕様は `docs/` を正本とします。

## v0.10-dev 共通基盤

SongProject v1 Adapter、Basic Pitchによる端末内Audio→MIDI、Note Edit / Quantize、Key Transpose / Degree Preserve / 12 Key生成、Channel 10 Drums移調除外、SongProject Keyへの整合、Stem IndexedDB保存 / Solo / Mute / Basic Pitch連携を実装。Android実機の長尺Audio・保存・音声形式確認は未完了。
