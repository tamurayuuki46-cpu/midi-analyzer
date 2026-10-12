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
- IndexedDB端末保存（初期OFF）
- 元MIDI bytes + 正規化Song保存
- 保存済みMIDI一覧 / 削除
- IndexedDB unit test 4件
- STORAGE_SPEC

開発中:
- IndexedDB保存基盤は実装済み。次の実装単位は読み取り専用Piano Roll

次に実装:
1. 読み取り専用Piano Roll
2. 固定binary MIDI fixtureによるParser integration regression test
3. Key / Scale Analyzer
4. Chord Analyzer + Degree
5. Melody / Bass / Rhythm基本分析

既知の問題:
- SMPTE time divisionはv0.1未対応
- Key / Chordの各閾値は仮値
- 6/8等の複合拍子のmusicalBeat表示ルールは実データで検証が必要
- Import時のroleHintは補助候補であり確定ではない
- 保存済みMIDIの「開く」は未実装（v0.1現在は一覧 / 削除のみ）
- Browser実機でのIndexedDB manual testが必要

触らない部分:
- mainを開発用にしない
- 過去Version / 復元Branch
- Demo Composerのproject.json Schema
- 元MIDI由来Noteを分析処理で直接変更しない
- `midi-file` raw event modelを `src/midi/` 外へ漏らさない
- 保存OFF時に元MIDI binaryを永続化しない

最近の重要な設計判断:
- MIDI Parserは `midi-file@1.2.4` を採用し `src/midi/` に隔離
- ViteをBuild Toolとしてのみ導入（Framework導入ではない）
- Storageはnative IndexedDBを利用し本番storage libraryを追加しない
- IndexedDB testのみ `fake-indexeddb@6.2.5` を利用
- 保存checkbox初期値はOFF
- 保存ON時のみ元MIDI bytes + Songを端末内へ保存
- 保存失敗でもImport結果を破棄しない
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

現在のStorage Schema:
IndexedDB `midi-analyzer` / version 1 / store `savedMidis`
record: storageSchemaVersion, id, savedAt, source, midiBytes, song, warnings

最終更新:
2026-10-12
