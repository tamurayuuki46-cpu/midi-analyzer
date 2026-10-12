# PLAYBACK_SPEC.md

## Version
v0.1-dev

## 目的
Imported MIDIのTimingを短時間で耳でも確認できる、最小のPlay / Stopプレビューを提供する。

DAW再生や元音色の再現は目的にしない。

## v0.1 Scope
- 曲頭からPlay
- Stop
- Tempo Map反映
- Note start / duration反映
- Velocityを簡易音量へ反映
- Channel 10 Drumは短いclick音で発音
- 通常Noteは簡易triangle oscillatorで発音
- 再Import時に旧再生を必ず停止
- 曲末で自動停止

## v0.1で行わない
- Pause / Resume
- Seek
- Loop
- Tempo変更
- Track Mute / Solo
- Instrument / GM音色再現
- SoundFont
- MIDI編集
- Metronome

## Timing
Normalized Songだけを入力にする。

### Tick → Seconds
`tempoMap`をTick順に区間化し、各区間で:

`seconds = ticks / ppq × microsecondsPerBeat / 1_000_000`

Tempo Change以前の経過時間を累積して変換する。

Tempo eventがtick 0にない場合は、Standard MIDI既定の120 BPM (`500000 µs/beat`)をtick 0に仮置きする。

同一tickにTempo eventが複数ある場合は最後のeventを使用する。

## Web Audio
Android Chromeのユーザー操作制約に合わせ、Playボタン押下時にAudioContextを生成 / resumeする。

長いMIDIで全Noteを一括生成しない。
- 50ms間隔のscheduler
- 約180ms先までlookahead scheduling

Stopでは:
- scheduler停止
- active Oscillator停止
- AudioContext close

再Import前にも既存controllerをdestroyして、旧MIDIの音が残らないようにする。

## 簡易音色
### 通常Note
- Oscillator: triangle
- Frequency: MIDI pitch → Hz
- Velocity: gainへ簡易反映
- 短いattack / release

### Channel 10
- Oscillator: square
- 約45msの短いclick
- Drum pitchごとに少しfrequencyを変える

これは原音再現ではなく、Timing / 音高 / Rhythmの概略確認用。

## UI
- Play / Stopは各52px以上の操作領域
- 再生開始中の二重Playを防止
- Playing / Stopped / Ended / Errorをstatusで表示
- 概算再生時間とNote数を表示
- 元音色ではないことを画面上に明記

## Error / Lifecycle
- Web Audio非対応時はPlayを無効化
- NoteなしMIDIではPlayを無効化
- AudioContext resume中にStop / 再Importが入っても、その旧sessionを再開しない
- 新しいImport時は以前のAudioContextを閉じる

## Test
自動テスト対象:
- 120 BPM Tick→seconds
- Tempo Change累積
- tick 0 Tempo fallback
- 同一tick Tempoの重複処理
- Note start / end schedule
- schedule sort / Channel 10判定
- 不正duration除外
- playback duration
- MIDI pitch → Hz
- Play / Stop lifecycle
- Noteなしerror
- resume中Stop race

Android実機で追加確認:
- 初回Playで音が鳴る
- Stopで即座に止まる
- 再Import時に旧音が残らない
- 画面ロック復帰後の再Play
- Bluetooth / 端末speakerで音量が過大でない
