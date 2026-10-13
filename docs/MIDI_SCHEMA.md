# MIDI_SCHEMA.md

## schemaVersion
`"0.1"`

## Import Result

Parser / Normalizer境界はSongだけでなくWarningを別レイヤーで返す。

```json
{
  "song": {},
  "warnings": []
}
```

Warningは元MIDIに不完全なNoteイベント等がある場合の情報で、Songの一部にはしない。

## Note
分析エンジンの唯一の音符入力。

```json
{
  "id": "track-1-note-1",
  "pitch": 60,
  "startTick": 0,
  "durationTick": 480,
  "velocity": 96,
  "trackId": "track-1",
  "channel": 0,
  "origin": "midi"
}
```

### origin
- `midi`
- `ripx`
- `separator`

### 重要
- Import後は読み取り専用
- 取り込み時に勝手なQuantizeやPitch修正をしない
- Note On velocity 0はMIDI仕様上のNote Offとして解釈する
- 対になるNote Offがない場合、durationを推測して作らない
- 補正が必要な分析は分析用派生データで行う

## Track

```json
{
  "id": "track-1",
  "name": "Piano",
  "channels": [0],
  "noteCount": 128,
  "isDrums": false,
  "roleHint": "chord"
}
```

### channels
1 Trackに複数MIDI Channelが存在しうるため配列とする。
UI表示時のみ1-based Channel番号へ変換する。
内部値は0-basedのまま保持する。

### Drum判定
基本判定は各Noteの `channel === 9`（MIDI Channel 10）を使用する。
Track内の完結したNoteがすべてchannel 9の場合、`Track.isDrums = true`。
`roleHint` はTrack名・Channelからの補助情報であり確定ではない。

## Song

```json
{
  "schemaVersion": "0.1",
  "source": {
    "fileName": "example.mid",
    "origin": "midi"
  },
  "ppq": 480,
  "tempoMap": [],
  "timeSignatures": [],
  "lengthTicks": 7680,
  "tracks": [],
  "notes": []
}
```

### tempoMap

```json
{
  "tick": 0,
  "microsecondsPerBeat": 500000,
  "bpm": 120,
  "implicit": true
}
```

MIDI内にtempo eventがない場合、Standard MIDIの既定として120 BPMをtick 0へ`implicit: true`で補う。
これはNoteデータの改変ではなく、時間解釈の既定値。

### timeSignatures

```json
{
  "tick": 0,
  "numerator": 4,
  "denominator": 4,
  "implicit": true
}
```

拍子eventがない場合は4/4をtick 0へ`implicit: true`で補う。

### SMPTE time division
v0.1では未対応。
PPQ (`ticksPerBeat`) がないSMPTE形式は明示的なUnsupported errorにする。
勝手にtickへ変換しない。

## Import Warning

例:

```json
{
  "code": "UNMATCHED_NOTE_ON",
  "trackId": "track-1",
  "tick": 960,
  "channel": 0,
  "pitch": 64
}
```

現在のcode:
- `UNMATCHED_NOTE_ON`
- `UNMATCHED_NOTE_OFF`

## Analysis Result
Songの外に保持する。

共通候補形:

```json
{
  "candidates": [
    {
      "value": "C major",
      "confidence": 0.82
    }
  ],
  "selected": null,
  "note": "候補です。確定ではありません。"
}
```

`selected` は人が選択した場合のみ設定する。
自動解析で勝手に確定しない。
