# Audio → MIDI (Basic Pitch)

更新日: 2026-10-13
対象Version: v0.10-dev

## 方針

MIDI AnalyzerのAudio→MIDIは、Spotifyの公式ブラウザ向け`@spotify/basic-pitch`を利用し、ユーザーが明示選択したAudioをブラウザ内で処理します。

自前BackendへAudioをUploadする処理はありません。Spotify配信Audioを取得・録音・リッピングする機能もありません。

## 処理フロー

```text
User Audio File
↓ Web Audio decode
22.05kHz / mono resample
↓
Basic Pitch local inference
↓
NoteEventTime[]
↓
MIDI encoder
↓
既存MIDI Analyzer Import
↓
Piano Roll / Key / Chord / Degree / Playback / SongProject Export
```

## 対応形式

UIでは以下を受け付けます。

- WAV
- MP3
- M4A
- AAC
- FLAC
- OGG / OGA
- WebM Audio

実際にデコードできる形式は端末/ブラウザのWeb Audio対応状況に依存します。対応していないCodecの場合は明示エラーにします。

## Android安全制限

現段階では以下を上限とします。

- 8分以内
- 120MB以下
- 22.05kHz monoへ変換
- 30秒chunk
- 1秒overlap

Basic Pitch推論はchunkごとに実行し、推論後のNoteはoverlap重複を除去します。

## Progress / Cancel

- decode
- resample
- model load
- inference
- complete

の段階で進捗表示します。

Cancelは`AbortController`を使用し、Basic Pitchのframe/chunk境界で処理を中断します。

## Model assets / Privacy

Build時に以下を`dist/basic-pitch-model/`へコピーします。

- `model.json`
- `group1-shard1of1.bin`

アプリと同一OriginからModelを取得するため、Audio本体を外部へ送信する必要はありません。

画面上では「端末内で処理」「Audio本体を自動で外部送信しない」と表示します。

## 現段階で未使用

Web Workerはまだ使用していません。推論はchunk化・Cancel対応済みですが、TensorFlow.js推論のWorker移行はAndroid実機の互換性/メモリ検証後に行います。

Audio BlobはSongProject JSONへ埋め込みません。

## MIDI化後

Basic Pitchから得たNoteは通常のMIDIへ変換し、既存Analyzerへ再Importします。そのため既存の以下を再利用します。

- Piano Roll
- Playback
- Key
- Chord
- Degree
- Melody / Bass / Rhythm analysis
- Song Project v1 Export

## Copyright

ユーザーが選択したAudioのみ処理します。画面上に「処理する権利のある音源を選んでください」と表示します。
