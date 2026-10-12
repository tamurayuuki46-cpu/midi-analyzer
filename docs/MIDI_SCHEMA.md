# MIDI_SCHEMA.md

## schemaVersion
`"0.1"`

## Note
分析エンジンの唯一の音符入力。

```json
{
  "id": "n-001",
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

### Drum判定
基本判定は各Noteの `channel === 9`（MIDI Channel 10）を使用する。
`Track.isDrums` はUI上の補助情報であり、Note単位判定を上書きしない。

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
