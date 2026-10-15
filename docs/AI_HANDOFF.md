# AI_HANDOFF.md

現在Version:
`v0.22-dev`

公開中Version:
`v0.18-dev`

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
v0.21の次を維持する。
- Chord Tone / Non-Chord Tone
- Scale Tone / Non-Scale Tone
- Chord × Scale 4分類
- Passing / Neighbor / Approach候補
- Natural / Harmonic / Melodic Minor比較
- Piano Roll可視化

v0.22では時間・拍・Chord change・着地Evidenceを追加する。

### Resolution candidate
Chord外音について、2 musicalBeat以内の次Noteを追う。次NoteがChord ToneならResolution候補。

Evidence:
- target pitch / tick
- delta tick / musicalBeat
- semitone interval
- up / down / same
- stepwise

次音がChord Toneでない場合はunresolved、文脈不足や時間超過はunknownとして保留。解決率を品質Scoreにしない。

### Strong / Weak beat context
Time SignatureからmusicalBeatを計算する。
- 4/4等: denominator単位
- 6/8等compound meter: denominator単位3つを1 musicalBeat

musicalBeat境界付近をstrong、それ以外をweakとして発音位置を観察する。アクセントの正解判定には使わない。

### Suspension candidate
次を満たす場合のみ候補。
- NoteがChord境界をまたぐ
- 旧ChordではChord Tone
- 新ChordではNon-Chord Tone
- 境界後2 musicalBeat以内に近接新Chord ToneへStep解決

### Anticipation candidate
次を満たす場合のみ候補。
- Chord境界前1 musicalBeat以内
- 現在ChordではNon-Chord Tone
- 次ChordではChord Tone
- 境界まで保持、または境界後に同Pitch再発音

### Phrase Landing
長めの休符前・曲末・任意Section境界前を着地候補として、Chord / Scale relation、Degree、gapを表示する。

### Piano Roll
v0.21のChord × Scale色分けを維持し、Passing / Neighbor / Approach / Resolution / Suspension / Anticipation候補を輪郭で補助表示する。read-only。

詳細:
- `docs/ANALYSIS_SPEC.md`
- `docs/NOTE_FUNCTION_ANALYSIS.md`

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
- Natural / Harmonic / Melodic Minor比較
- Piano Roll Note Function可視化
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
- Higher-level Metricsを品質Scoreとして扱わない
- 外部AIへ自動送信しない
- Mixer / Mastering / Plugin Hostingを追加しない
- 本格Composition / Arrangement機能を追加しない

## v0.22-dev 開発状態
開発Branch:
`chatgpt/resolution-landing-v0.22`

変更前復元点:
`restore/develop-before-resolution-landing-v0.22-20261015`

変更前develop commit:
`fc29b0613adb5ca826c2fff72487a1423c4658ad`

PR:
`#55`

Issue:
`#54`

Schema変更なし。

## Git運用
- `develop`: 開発統合
- `main`: CI合格版かつGitHub Pages公開元
- stable tag: Android実機 + 必要なCubasis/Cubase実機確認後のみ
- developへのpushでは公開しない
- mainへの公開はPR経由
- 過去Branch / Tag / Version / Backupを削除・上書きしない

## 継続確認
- PR #55のUnit Test / Production Build / regression
- Android実機でv0.22 Note Function表示とタッチ操作
- 4/4 / 6/8実曲でstrong/weak境界確認
- Suspension / Anticipation / Resolution閾値の実曲チューニング
- PWA再起動後の表示設定
- Moises WAV/MP3/M4A Stem Import
- 長尺Audio / quota / Cancel / retry
- Clip v1 / v2混在Library
- Cubasis / Cubase実機取込

stable tagは実機確認前に作成しない。
