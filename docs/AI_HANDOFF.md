# AI_HANDOFF.md

現在Version:
`v0.12-dev`

公開中Version:
`v0.11-dev`

最新安定版:
未作成

最終更新: 2026-10-13

## 最重要の役割

MIDI Analyzerの役割は2つだけ。

1. **素材を集める**
2. **曲を理解する**

正式Workflow:

`作曲シート → 必要なら Moises → MIDI Analyzer → Demo Composer → Arrangement Lab → 必要なら Cubasis → PC DAW（必須）`

正本: `docs/ROLE_BOUNDARY.md`

MoisesをStem分離の主入口とし、MIDI AnalyzerはMoises / RipX / Audio等から受け取った素材を保存・素材化・Audio→MIDI・分析する。

MIDI Analyzer自身がComposition / Arrangementの所有者にならない。

## v0.12-devでの境界整理

### Part Recorder

v0.7で実装したPart Recorderは主UIから退役。

- Recorder TabをMain navigationから除外
- `mountRecorderTab`をmain flowから除外
- 既存`savedTakes`を削除しない
- IndexedDB version 3 / savedTakes migrationを維持
- 旧Take dataは互換性のため保持

### Material Provenance

素材Clipは新規保存から`clipSchemaVersion: 2`。

`provenance.type`:
- self
- reference
- moises-stem
- audio-to-midi
- ripx
- book
- plugin
- manual
- other
- unknown

保持可能:
- sourceTitle
- sourceProjectId
- usedInProjectIds[]
- importedFrom
- createdBy
- recordedAt

検索対象にも含める。

既存Clip v1は自動変換・削除しない。provenance無しでも表示・検索可能。

### Stem Provenance

Stem DB versionは1のまま。

新規Stemへoptional provenanceを保存:
- type
- sourceTitle
- sourceProjectId
- importedFrom

既存Stemは旧`source`から推定できる場合だけfallbackする。
MoisesをDefaultの外部分離入口としてUIに表示する。

## 現在実装済み主要機能

### 素材を集める
- MIDI Import / 保存
- Audio Import
- Basic Pitch Audio→MIDI
- Note Edit / Quantize
- Moises / RipX等のStem Import
- Stem IndexedDB / Solo / Mute / Basic Pitch連携
- 4小節Clip Library
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

## Tab順 v0.12-dev

`overview / harmony / melody / bass / rhythm / structure / visual / compare / library / export / ai / metrics / parts`

Recorderは主Tabから削除済み。

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

MIDI Analyzer owner:
- `analysis`
- `reference`

保持する:
- `composition`
- `arrangement`

Demo Composer SchemaやCompositionをAnalyzer都合で変更しない。

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

## 現在の開発Branch

`chatgpt/workflow-boundary-cleanup`

変更前復元点:
`restore/before-workflow-boundary-2026-10-13`

PR:
`#30 refactor: focus MIDI Analyzer on materials and understanding (v0.12-dev)`

## Git運用

- `develop`: 開発統合
- `main`: CI合格版かつGitHub Pages公開元
- stable tag: Android実機 + 必要なCubasis/Cubase実機確認後のみ
- developへのpushでは公開しない
- mainへの統合 / 公開は明示承認後

## 継続確認

- Android実機でMoises WAV/MP3/M4A Stem Import
- 長尺Audio / quota / Cancel / retry
- Provenance入力のスマホ操作性
- Clip v1 / v2混在Library
- Cubasis / Cubase実機取込
- v0.9 Metrics係数 tuning

## 重要な復元ポイント

既存milestoneに加え:
- `restore/before-workflow-boundary-2026-10-13`

v0.12-devがdevelop統合後、feature-complete復元点を追加する。
