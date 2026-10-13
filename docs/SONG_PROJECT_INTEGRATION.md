# MIDI Analyzer ↔ Song Project v1

更新日: 2026-10-13
Version: v0.10-dev
Song Project schemaVersion: 1

## 目的

MIDI Analyzerの解析結果をDemo Composer / Arrangement Labと共通のSong Project v1へ安全に渡す。

Analyzerの主担当は`analysis`と`reference`です。既存SongProjectへ再解析結果を書き戻す場合、`composition`と`arrangement`は変更しません。

## 新規Project生成

`buildSongProjectFromAnalysis(song, bundle)`

新しくMIDIから共通Projectを作る場合は、Demo Composerで直ちに利用できる初期値として以下をseedします。

- basic.bpm
- basic.key
- basic.scale
- composition.chords
- composition.melody candidate
- composition.counterMelody candidate
- composition.bass candidate
- composition.drums candidate

これらは解析候補を元にした初期値であり、自動確定ではありません。

## 既存ProjectへのMerge

`mergeAnalyzerAnalysisIntoSongProject(songProject, song, bundle)`

更新対象:

- `analysis`
- `reference`
- `basic`（BPM / Key / Scale / Time Signature / PPQ。`updateBasic:false`で抑止可能）
- `compatibility.midiAnalyzer`

保持対象:

- `composition`
- `arrangement`
- 他アプリの`compatibility`

Adapter内でComposition / Arrangementが不意に変化していないことを検査します。

## analysis mapping

- `keyCandidates` ← Analyzer Key candidates
- `chordCandidates` ← chord segments / candidates
- `degreeAnalysis` ← top chord progression
- `melodyAnalysis` ← Melody analysis
- `bassAnalysis` ← Bass analysis
- `rhythmAnalysis` ← Rhythm analysis

元のAnalysis Bundleも`compatibility.midiAnalyzer.analysisBundle`へ保持し、将来の情報欠損を防ぎます。

## reference

現段階ではAudio Blobを入れません。ImportされたMIDIのsource metadataのみ`reference.items[]`へ保存します。

## Demo Composer compatibility

新規SongProject生成時は既存`buildDemoComposerProject()`を再利用し、`compatibility.demoComposer.legacyProject`へSchema 3互換Projectを保持します。

これにより共通ProjectをDemo Composer v0.4-dev側へ渡したとき、BPM / Key / Scale / Chords /解析由来Track候補を復元できます。

## Privacy

すべてブラウザ内で生成し、自動Uploadしません。Export / Shareはユーザー操作時のみです。

## Test

`test/songProjectAdapter.test.js`

確認項目:

- schemaVersion 1
- BPM / Key / Scale引継ぎ
- Chord / Melody / Bass / Drums seed
- analysis保存
- MIDI reference metadata保存
- Demo Composer互換Snapshot
- 既存SongProjectへ再解析MergeしてもComposition不変
- Arrangement不変
