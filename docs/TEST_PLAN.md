# TEST_PLAN.md

## 実装済み自動テスト

### Parser / Normalizer
- 正規化 / Drum / 複数Channel / 既定Tempo拍子 / Warning / SMPTE拒否 / origin
- 固定binary MIDI fixture Format 0 / Format 1を実Parser経由で検証

### Storage
- IndexedDB保存 / 一覧 / 削除 / record構造

### Piano Roll
- Track抽出 / 初期Track / Pitch Range / MIDI境界 / bar-beat marker / Note名 / 拍子変更

### Key / Chord / Top 1 Progression
- major / minor基本判定、Drum除外、duration × velocity
- C / Am / G7 / 転回形 / Track選択 / Degree / 6/8
- 同一Chord区間集約
- 各Chord segmentの`candidates[0]`を時間順に保持
- Candidateなしsegmentを安全にskip

### Melody / Bass / Rhythm Basic Analysis
- roleHint / fallback Track選択
- Melody音域 / 跳躍 / 同音連打 / 密度 / Chord Tone
- Bass移動 / Root・3rd・5th・Other
- Rhythm拍位置 / 密度 / 16分Grid / 6/8 musicalBeat

### Playback
- Tempo Mapのtick→秒変換
- Note schedule / Channel 10 / duration 0除外
- Play / Stop / AudioContext lifecycle

### v0.2 Motif / Structure / Harmony Detail
- 移調Motif反復
- 4小節Section類似候補
- 隣接BlockのKey変化 / 転調候補
- Slash Chord候補
- add9色付け候補

### v0.3 Compare / Personal Trend
1. Song summaryがKey / Chord / Melody / Bass / Rhythm指標を返す
2. 同一Song比較では主要delta=0、Chord共通度=100%
3. 移調した参考曲と自作曲を別の比較結果として扱うが、優劣評価しない
4. 保存済み2曲から平均BPM・Key等のPersonal Trendを集計する
5. 保存済みSong 0件では空Trendを安全に返す

実行:
```bash
npm test
npm run build
```

## 実MIDIテスト候補
- C–G–Am–F / 1小節2コード / C/E / 少音数伴奏
- RipX非Quantize / Scaler・EZkeys Quantize
- 3/4 / 6/8 / Tempo Change / Channel 10 Drum
- Melody和音化 / Bass Track名曖昧 / Drumなし
- 移調Motif / A-B-A構造 / 半音・全音転調
- add9 / 11 / 6・13 / 長いTop 1コード進行
- 同じ曲を移調した2 MIDI比較
- 参考曲と自作曲でBPM / 音域 / 密度が明確に異なる比較
- 保存済みMIDIを3曲以上にしてPersonal Trend集計

## Android Manual
- Import / Play / Stop / 再Import
- Storage保存 / 削除 / 再読み込み
- Piano Roll / Key / Chord / Top 1コード進行
- Melody / Bass / Rhythm基本分析
- v0.2発展分析Panel
- v0.3比較用MIDI File pickerが片手で操作できる
- 参考曲 / 自作曲の比較カードが320px幅で横崩れしない
- 比較Metricが縦方向に読みやすい
- 保存直後にPersonal Trend集計曲数が更新される
- 保存済みMIDI削除後にPersonal Trendが再集計される
- 比較用MIDIが保存一覧へ勝手に追加されない

## Regression
Analysis Engine / Playback変更前後で固定MIDIを再解析・再scheduleし、意図しない結果変化がないか確認する。
アルゴリズム結果変更はCHANGELOGへ記録する。
