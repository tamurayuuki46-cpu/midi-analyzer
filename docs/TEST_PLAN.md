# TEST_PLAN.md

## 実装済み自動テスト

### Parser / Normalizer
- 正規化 / Drum / 複数Channel / 既定Tempo拍子 / Warning / SMPTE拒否 / origin
- 固定binary-like MIDI fixture Format 0 / Format 1を実Parser経由で検証

### Storage
- IndexedDB保存 / 一覧 / 削除 / record構造

### Piano Roll
- Track抽出 / 初期Track / Pitch Range / MIDI境界 / bar-beat marker / Note名 / 拍子変更

### Key Analyzer
- major / minor基本判定
- Drum除外
- duration × velocity
- confidence / 候補なし

### Chord Analyzer
1. C major triad → C
2. A minor triad → Am
3. C/E転回形 → C
4. G7構成音あり → G7
5. Track選択 / Channel 10除外
6. 2音だけの候補はconfidenceを下げる
7. 6/8: analysisGrid=8分 / musicalBeat=付点4分
8. C major Degree: C=I / B♭=♭VII音階外
9. A minor Degree: C=III / G♯=♯VII音階外
10. 同一小節で同じChordが続くGridを1区間にまとめる

### Melody / Bass / Rhythm Basic Analysis
1. roleHintをMelody / Bass初期Trackとして優先
2. roleHintなしでは平均Pitch最高/最低Trackをfallback
3. Melody: 音域 / 跳躍 / 同音連打 / 密度 / Chord Tone比率
4. Melody: 同一Tick複数Noteを代表Noteへ集約
5. Bass: Root / 3rd / 5th / Other分類
6. Bass: 同一Tickでは最低Pitchを代表Noteとして移動量計算
7. Rhythm: Drum Track優先 / 4/4密度 / 16分Grid
8. 6/8: musicalBeatを付点4分として拍位置判定
9. MIDI Pitch表記

### Playback Schedule
1. 120 BPMで4分音符=0.5秒
2. Tempo Changeの累積時間
3. tick 0 Tempoなし時の120 BPM fallback
4. 同一tick Tempo eventは最後を使用
5. Note start / endへTempo Mapを反映
6. schedule順序 / Channel 10判定
7. duration 0 Noteを除外
8. 曲の再生長を最終Note endから算出
9. MIDI A4 = 440 Hz

### Playback Controller
1. PlayでWeb Audio nodeをscheduleし、StopでAudioContext close
2. NoteなしSongは再生error
3. AudioContext resume中にStopしても旧sessionを開始しない

実行:
```bash
npm test
npm run build
```

## 実MIDIテスト候補
1. C–G–Am–F（各1小節）
2. 1小節2コード
3. 転回形 C/E
4. 音数が少ない伴奏
5. RipX想定の非Quantize MIDI
6. Scaler / EZkeys想定のQuantize MIDI
7. 3/4
8. 6/8
9. ループ曲
10. イントロだけ別調
11. Melodyが和音化されたMIDI
12. Bass Track名が曖昧なMIDI
13. Drumなしで全TrackからRhythmを見るMIDI
14. Tempo Changeを含むMIDI
15. Channel 10 Drumを含むMIDI

## Android Manual
2026-10-13: GitHub Pages公開版をAndroid Chrome実機で確認し、以下の基本Smoke Testを通過。
- MIDI Import
- 端末保存 / 再読込
- Play / Stop
- Piano Roll
- Key / Scale
- Chord / Degree
- Melody / Bass / Rhythm Basic Analysis
- スマートフォン幅での主要操作・スクロール

実MIDI安定化時の追加回帰確認:
- Import後にPlayで初回から音が鳴る
- Stopで即座に音が止まる
- 再Import時に旧MIDIの音が残らない
- 曲末で自動停止し、再びPlayできる
- 画面ロック / 復帰後に再Playできる
- 端末speaker / Bluetoothで音量が過大でない
- Chord Track checkboxが片手で押せる
- Chord候補3つが縦スクロールで読みやすい
- Key選択を変えるとDegreeが即時更新される
- Chord候補選択が区間ごとに保持される
- Chord候補選択でMelody Chord Tone / Bass Chord Roleが再計算される
- Melody / Bass Track selectが片手で操作できる
- Rhythmの複数Track checkboxが操作しやすい
- 16分Gridが320px幅でも横にはみ出さない
- 長いMIDIでChord区間数が多くてもページが破綻しない
- Import / Storage / Piano Roll / Key / Chord / Basic Analysis機能が回帰していない

## Regression
Analysis Engine / Playback変更前後で固定MIDIを再解析・再scheduleし、意図しない結果変化がないか確認する。
アルゴリズム結果変更はCHANGELOGへ記録する。
