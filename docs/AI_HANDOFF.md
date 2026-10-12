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
- MIDI Import UI
- `midi-file@1.2.4` Parser Adapter
- Standard MIDI File → Song / Track / Note正規化
- Tempo Map / Time Signature正規化
- Track一覧表示
- RipX origin記録
- 不完全Note Warning処理
- Normalizer unit test 7件
- GitHub Actions CI（test + build）設定

開発中:
- MIDI Import基盤は実装済み。次の実装単位はIndexedDB保存

次に実装:
1. IndexedDB保存（保存する / しない、初期値は保存しない）
2. 保存済みMIDI一覧 / 削除
3. 読み取り専用Piano Roll
4. 固定binary MIDI fixtureによるParser integration regression test
5. Key / Scale Analyzer

既知の問題:
- SMPTE time divisionはv0.1未対応
- Key / Chordの各閾値は仮値
- 6/8等の複合拍子のmusicalBeat表示ルールは実データで検証が必要
- Import時のroleHintは補助候補であり確定ではない
- CI workflowは設定済み。初回remote build結果は未確認

触らない部分:
- mainを開発用にしない
- 過去Version / 復元Branch
- Demo Composerのproject.json Schema
- 元MIDI由来Noteを分析処理で直接変更しない
- `midi-file` raw event modelを `src/midi/` 外へ漏らさない

最近の重要な設計判断:
- MIDI Parserは `midi-file@1.2.4` を採用し `src/midi/` に隔離
- ViteをBuild Toolとしてのみ導入（Framework導入ではない）
- Motifはv0.2以降
- Track.channel単一前提を廃止し channels[] を採用
- Drum判定はNote.channel === 9を基本とする
- Track内に複数Channelがある場合はTrack.isDrumsをtrueにしない
- Chord分析対象Trackはユーザーが選択可能
- 6/8ではanalysisGridとmusicalBeatを分離
- v0.1 UIに一般Exportを置かない
- selectedは人が選択したときだけ設定
- 不完全Noteのdurationを推測して作らない

現在のMIDI Schema:
schemaVersion "0.1"
Note: id, pitch, startTick, durationTick, velocity, trackId, channel, origin
Track: id, name, channels[], noteCount, isDrums, roleHint
Song: schemaVersion, source, ppq, tempoMap, timeSignatures, lengthTicks, tracks, notes
Import Result: { song, warnings }
Analysis ResultはSong外

最終更新:
2026-10-12
