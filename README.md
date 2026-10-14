# MIDI Analyzer

Androidスマートフォン中心の作曲支援PWAです。役割は次の2つに限定します。

1. **素材を集める**
2. **曲を理解する**

作曲や編曲そのものは担当しません。

## 現在Version

- develop/current: `v0.17-dev`
- `VERSION`: `v0.17-dev`
- `package.json`: `0.17.0-dev`
- main/public: `v0.17-dev`
- 公開先: `https://tamurayuuki46-cpu.github.io/midi-analyzer/`
- SongProject: v1 (`schemaVersion: 1`)

`develop`は開発統合、`main`は自動テスト・build・回帰CI合格の公開候補かつGitHub Pages公開元です。stable tagはAndroid実機と必要なCubasis/Cubase実機確認後のみ作成します。mainへ直接変更しません。

2026-10-15の安定化開始時、旧`develop`が`main`の祖先であることを確認し、復元点作成後に`main → develop`をfast-forwardして安全同期しました。

## 正式Workflow

`作曲シート → 必要なら Moises → MIDI Analyzer → Demo Composer → Arrangement Lab → 必要なら Cubasis → PC DAW（必須）`

詳細: `docs/ROLE_BOUNDARY.md`

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

素材ClipとStemは、元曲・元Project・生成元などのprovenanceを可能な範囲で保持します。

## 2. 曲を理解する

v0.17-devでは、MIDI読み込み後に**初心者モード**を最初に表示します。

- Key候補
- 音域
- 音の動き
- リズム
- 反復
- 良いところ
- 改善するとよいところ
- 次に試すこと（最大3件）

必要な時だけ詳細モードへ切り替え、従来のHarmony / Melody / Bass / Rhythm / Structure / Visual / Compare / Library / Export / AI / Metrics / Parts等を使用します。Higher-level Metricsは品質・人気・正解の採点ではなく、理解のための候補値と根拠です。

## Moisesとの役割分担

**Moises = 音源を分ける**

**MIDI Analyzer = 分けた素材を集める・理解する**

MIDI Analyzer自身をStem分離サービスにはしません。Moises等で書き出したStemを受け取り、保存・試聴・Audio→MIDI・分析へつなぎます。

## Demo Composerとの役割分担

MIDI AnalyzerはAnalysis / Reference / Clip / Materialを渡します。Chord / Melody / Bass / Drum / Counter Melodyを作る所有者はDemo Composerです。

## SongProject v1 所有権契約

MIDI Analyzerが更新してよい領域:
- `analysis`
- 解析対象を表す`reference` metadata
- `compatibility.midiAnalyzer`
- `updatedAt`

既定で保持する領域:
- `lineage`
- `intent`
- `basic`
- `composition`
- `arrangement`
- `history`
- `assets`
- `export`

BPM / Key / Scale等の`basic`は解析だけで上書きしません。解析値を反映するのは`updateBasic: true`を明示した操作だけです。Audio/MIDI/Stem Blob本体をSongProject JSONへ埋め込みません。

契約テスト:
- `test/songProjectOwnershipContract.test.js`
- `test/songProjectAdapter.test.js`
- `.github/workflows/ci.yml`

詳細: `docs/SONG_PROJECT_V1.md`

## 保存方針

- MIDI Import時の端末保存は初期OFF
- 初心者 / 詳細モードの表示設定はlocalStorageへ端末内保存
- Clipは明示保存時のみ
- Stemは明示Import時のみ
- 既存Takeは互換性のため保持
- Audio BlobをSongProject JSONへ直接埋め込まない
- 解析・Explainabilityを外部へ自動送信しない

## 実装済み主要機能

- `.mid` / `.midi` Import / Normalized Song
- 初心者モード / 詳細モード
- IndexedDB MIDI保存 / 一覧 / 削除
- Piano Roll / Playback
- Key / Scale / Chord / Degree
- Melody / Bass / Rhythm / Motif / Section分析
- Compare / Personal Trend / Visualization
- Clip Library / 素材Provenance
- Basic Pitch Audio→MIDI
- Note Edit / Quantize
- Key Transpose / Degree Preserve / 12 Key生成
- Stem IndexedDB / Solo / Mute / Basic Pitch連携
- Analysis JSON / CSV / Markdown / Chord-Degree Text Export
- RipX Bridge
- Explainability / Higher-level Metrics
- SongProject v1 Adapter
- GitHub Actions CI / GitHub Pages

## 開発

```bash
npm install
node --test test/songProjectOwnershipContract.test.js
npm test
npm run build
```

CIではUnit test、Production build、Basic Pitch local model asset確認、Mobile Chromium回帰を実行します。TypeScriptは使用していないため専用typecheckは現状未設定です。

## 開発開始時に読む順番

1. `README.md`
2. `VERSION`
3. `docs/AI_HANDOFF.md`
4. `docs/ROLE_BOUNDARY.md`
5. `docs/SONG_PROJECT_V1.md`
6. `docs/CURRENT_RELEASE.md`
7. `docs/BEGINNER_MODE.md`
8. `docs/STORAGE_SPEC.md`
9. `CHANGELOG_v0.17.md`
10. `CHANGELOG.md`

重要仕様は`docs/`を正本とします。

## Git / Release

- `develop`: 開発統合
- `main`: CI/build/回帰合格の公開候補 + GitHub Pages公開元
- mainへ直接pushしない
- 過去Version / Branch / Tag / Backupを削除・上書きしない
- 大きな変更前にrestore pointを作る
- stable tag: Android実機 + 必要なCubasis/Cubase実機確認後のみ

2026-10-15安定化復元点:
- `restore/develop-before-stabilization-20261015`

## 実機継続課題

- Android実機でMoises WAV/MP3/M4A Stem Import
- Android PWA / 再起動後設定保持
- 長尺Audio / quota / Cancel / retry
- Clip v1 / v2混在Library
- Cubasis / Cubase実機取込

実機確認前はstable tagを作成しません。
