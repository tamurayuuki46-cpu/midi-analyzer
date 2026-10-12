# PART_RECORDING_SPEC.md

## Version
v0.7-dev

## 目的
MIDI Analyzer内で、読み込んだMIDIのTrackをMelody / Chord / Bass / DrumなどのパートごとにSolo再生し、その簡易音源Audioを個別Takeとして録音・保存する。

## 対象
- Android Chromeを中心としたWeb Audio対応ブラウザ
- Web Audio API
- MediaRecorder API
- IndexedDB

## 非対象
- RipX / Cubasis / Cubaseなど他アプリ内部音声の直接録音
- マイク入力の録音
- 元MIDIの編集
- 本物のGM音源・VST音色の再現
- WAV固定出力

MediaRecorderの出力形式はブラウザ依存とし、Android Chromeでは主にWebM/Opusを優先する。

## Recorder Tab
カテゴリTabへ`Recorder`を追加する。

基本操作:
1. Partを選ぶ
2. 録音対象Trackを選ぶ
3. Take名を任意入力
4. Monitor ON/OFFを選ぶ
5. REC
6. STOPまたは曲末で自動停止
7. Takeを端末内へ保存

## Part候補
Part Type:
- melody
- chord
- bass
- drum

既定TrackはroleHintを優先する。

roleHintがない場合:
- Melody: 非Drum Trackの平均Pitchが最も高いTrack
- Bass: 非Drum Trackの平均Pitchが最も低いTrack
- Chord: Melody/Bass候補以外の非Drum Track。なければ非Drum Track全体
- Drum: isDrumsまたはMIDI Channel 10を含むTrack

ユーザーはRecorder TabでTrackを手動選択できる。

## 録音Audio
既存Playbackと同じ簡易音源を利用する。

- pitched note: triangle oscillator
- drum: square click
- Tempo Mapを反映
- 元MIDIのtick位置を維持
- 選択Trackだけを録音
- 元Song / Note / Trackは変更しない

録音中のMonitorをOFFにした場合、AudioはMediaRecorderへ送りつつ端末speakerへの出力を接続しない。

## Take
Take record:

```text
takeSchemaVersion
id
savedAt
name
partType
trackIds
source
  fileName
  origin
mimeType
durationSeconds
eventCount
audioBytes
```

## Take UI
保存済みTakeについて以下を提供する。

- Preview再生
- Aへセット
- Bへセット
- A/B個別Audio再生
- Audio書き出し
- 削除

A/Bは同時再生ではなく、ユーザーが各Takeを切り替えて比較する用途とする。

## Audio書き出し
MediaRecorderのmimeTypeに応じた拡張子を使う。

- audio/webm → `.webm`
- audio/mp4 → `.m4a`
- audio/ogg → `.ogg`
- audio/wav → `.wav`

## IndexedDB Migration
Database: `midi-analyzer`

v0.7でDB versionを`3`へ上げる。

Stores:
- `savedMidis`
- `savedClips`
- `savedTakes`

v1/v2からv3へUpgradeする際、既存`savedMidis` / `savedClips` recordは削除・変換しない。
`savedTakes`だけ追加する。

## Error Policy
- MediaRecorder非対応でもMIDI解析機能は継続利用可能
- IndexedDB保存失敗でもImport済みMIDIは破棄しない
- 録音開始失敗時は既存Playback/Analyzerへ影響させない
- 再Import時は録音Controllerをdestroyして旧sessionを停止する

## Testing
Unit Testで以下を固定する。

- Part Track推定
- Part Song filter
- Take Record生成
- mimeType→拡張子
- IndexedDB v1→v3 Migration
- IndexedDB v2→v3 Migration
- savedTakes save/get/list/delete
- Tab navigationにRecorderを追加
- Production Build

## Known Limitations
- MediaRecorder形式はブラウザ依存
- AudioはMIDI Analyzer簡易音源で、元DAW/RipXの音色ではない
- マイク / 外部Audio inputは未対応
- WAV固定rendererは未実装
- 同時Multi Stem録音は未実装。v0.7は1回のRECで選択Track群を1 Takeとして録音する
- Android実機でMediaRecorder / Audio書き出し確認が必要
