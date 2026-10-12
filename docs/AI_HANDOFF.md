# AI_HANDOFF.md

現在Version:
v0.1-dev

最新安定版:
未作成

現在実装済み:
- 初期Repository構成
- 共通仕様書初版
- MIDI Schema v0.1
- Analysis仕様 v0.1
- Android UI方針
- RipX / Demo Composer連携境界
- 将来Separator interface

開発中:
- なし（実装開始前）

次に実装:
1. MIDI Parser Adapter
2. Standard MIDI File → Song / Note正規化
3. Import画面
4. Track一覧
5. 固定テストMIDIとParser Regression Test

既知の問題:
- Key / Chordの各閾値は仮値
- 6/8等の複合拍子のmusicalBeat表示ルールは実データで検証が必要
- MIDI Parserライブラリの最終採用は実装開始時に再確認

触らない部分:
- mainを開発用にしない
- 過去Version / 復元Branch
- Demo Composerのproject.json Schema
- 元MIDI由来Noteを分析処理で直接変更しない

最近の重要な設計判断:
- Motifはv0.2以降
- Track.channel単一前提を廃止し channels[] を採用
- Drum判定はNote.channel === 9を基本とする
- Chord分析対象Trackはユーザーが選択可能
- 6/8ではanalysisGridとmusicalBeatを分離
- v0.1 UIに一般Exportを置かない
- selectedは人が選択したときだけ設定

現在のMIDI Schema:
schemaVersion "0.1"
Note: id, pitch, startTick, durationTick, velocity, trackId, channel, origin
Track: id, name, channels[], noteCount, isDrums, roleHint
Song: schemaVersion, source, ppq, tempoMap, timeSignatures, lengthTicks, tracks, notes
Analysis ResultはSong外

最終更新:
2026-10-12
