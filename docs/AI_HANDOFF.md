# AI_HANDOFF.md

現在Version:
`v0.18-dev`

公開中Version:
`v0.17-dev`

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

MoisesをStem分離の主入口とし、Archive/AnalyzerはMoises / RipX / Audio等から受け取った素材を保存・素材化・Audio→MIDI・分析する。
Composition / Arrangementの所有者にはならない。

## v0.18-dev 初心者導線

### 読み込み前

最初に次の2択を表示する。

1. `MIDIを保存・整理する`
   - `#save-midi`をONにしてMIDI Importへ進む。
2. `MIDIを解析する`
   - 保存はOFFのままでも解析できる。

補助操作:
- 保存済みMIDIを見る
- 詳細ツールを表示 / 隠す

初心者時は以下を初期状態で隠す。
- Audio→MIDI
- Audio Note Tools
- Stem Reference

開始画面の表示設定:
`midi-analyzer.start-mode.v1`

### 読み込み後

初心者分析を最初に表示する。

- Key
- 音域
- 音の動き
- リズム
- 反復
- 良いところ
- 改善するとよいところ
- 次に試すこと（最大3件）

必要な場合だけ詳細13タブへ切り替える。
解析表示設定:
`midi-analyzer.analysis-mode.v1`

詳細: `docs/BEGINNER_MODE.md`

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
- Motif / Section / 転調
- 裏メロ / Bass / Drum詳細
- Track役割候補
- Visualization / Energy / Section Map / Heatmap
- 2 MIDI比較 / 参考曲 vs 自作曲
- Personal Trend
- Explainability / この曲から学べること
- Higher-level Metrics 6種 + Evidence

## Tab順

`overview / harmony / melody / bass / rhythm / structure / visual / compare / library / export / ai / metrics / parts`

Recorderは主Tabから退役済み。

## Storage

### Database `midi-analyzer` / version 3
- `savedMidis`: 元MIDI + Normalized Song
- `savedClips`: Clip Library。新規はClip Schema 2、旧v1保持
- `savedTakes`: legacy Part Recorder Take。退役済みだが保持

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

Demo Composer SchemaやCompositionをArchive/Analyzer都合で変更しない。
参考曲をそのまま自作Compositionへ自動変換しない。

## 触らない部分

- `main`を開発用にしない
- 過去Version / 復元Branch / tagを削除・上書きしない
- 元MIDI由来Noteを分析目的で自動変更しない
- `midi-file` raw modelを`src/midi/`外へ漏らさない
- 保存OFF時に元MIDI binaryを永続化しない
- Key / Chord / Section / Motif / 転調 / Track役割を自動確定しない
- Higher-level Metricsを品質Scoreとして扱わない
- 外部AIへ自動送信しない
- Mixer / Mastering / Plugin Hostingを追加しない
- 本格Composition / Arrangement機能を追加しない

## v0.18-dev 開発状態

開発Branch:
`chatgpt/rename-midi-archive-analyzer-v0.18-20261015`

変更前復元点:
`restore/develop-before-midi-archive-analyzer-v0.18-20261015`

v0.18では表示名変更と初心者スタート導線を追加する。
SongProject / IndexedDB / Clip / Stem Schemaは変更しない。

## Git運用

- `develop`: 開発統合
- `main`: CI合格版かつGitHub Pages公開元
- stable tag: Android実機 + 必要なCubasis/Cubase実機確認後のみ
- developへのpushでは公開しない
- mainへの公開はPR経由
- 過去Branch / Tag / Version / Backupを削除・上書きしない

## 継続確認

- Android実機で初心者スタートのタッチ操作
- PWAインストール時に`MIDI Archive/Analyzer`と表示されること
- Moises WAV/MP3/M4A Stem Import
- 長尺Audio / quota / Cancel / retry
- Clip v1 / v2混在Library
- Cubasis / Cubase実機取込

stable tagは実機確認前に作成しない。
