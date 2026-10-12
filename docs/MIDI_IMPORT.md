# MIDI_IMPORT.md

## Version
v0.1-dev

## 目的
Standard MIDI FileをAndroid Chromeから読み込み、分析エンジンが利用する共通Song Schemaへ安全に正規化する。

## 対応
- `.mid`
- `.midi`
- PPQ / ticksPerBeat形式
- MIDI Format 0 / 1をraw track eventとして処理
- Note On / Note Off
- Note On velocity 0によるNote Off
- Tempo change
- Time Signature change
- 1 Track内の複数MIDI Channel

## v0.1未対応
- SMPTE time division
- Audio file
- MIDI編集
- Import時Quantize
- 不完全Noteの自動修復

## Parser dependency
`midi-file@1.2.4`

使用箇所は `src/midi/parseMidiFile.js` のみに限定する。
NormalizerとAnalysis側はpackage固有形式へ依存しない。

## Import Flow

```text
<input type=file>
↓
File.arrayBuffer()
↓
midi-file parseMidi(Uint8Array)
↓
normalizeMidi()
↓
{ song, warnings }
↓
Overview / Track List UI
```

## Normalization Rule

### tick
秒へ変換せずtickを正本として保持する。
各TrackのdeltaTimeを累積してabsolute tickを計算する。

### Note Pairing
同じTrack内で `channel + pitch` ごとにNote Onをqueue管理する。
Note Offは最も古い未完了Note Onと対応させる。

### 不完全Note
Note OffのないNote Onや、対応するNote OnがないNote Offは勝手に修正しない。
Warningへ出し、正規化Noteには含めない。

### Tempo / Time Signature
複数Trackから収集しtick順へ正規化する。
同tickに複数eventがある場合は後に現れたeventを有効値として扱う。

### Track roleHint
Track名とChannelだけから以下の候補を出す。
- melody
- chord
- bass
- drums
- null

確定分類として扱わない。

## UI
Import完了時に表示:
- File名
- PPQ
- Track数
- Note数
- 最初のTempo
- 最初の拍子
- lengthTicks
- Track名
- Note数
- Channel
- roleHint
- Drum hint

現在はメモリ上のみで扱う。
IndexedDB保存は次の作業。
