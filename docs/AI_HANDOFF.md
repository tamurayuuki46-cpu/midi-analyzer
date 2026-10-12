# AI_HANDOFF.md

現在Version:
v0.1-dev

最新安定版:
未作成

現在実装済み:
- 初期Repository構成 / 共通仕様書
- MIDI Schema v0.1 / Analysis仕様 v0.1
- MIDI Import UI
- `midi-file@1.2.4` Parser Adapter
- Standard MIDI File → Song / Track / Note正規化
- Tempo Map / Time Signature正規化
- Track一覧表示
- RipX origin記録
- 不完全Note Warning処理
- Normalizer unit test 7件
- GitHub Actions CI（test + build）
- IndexedDB端末保存（初期OFF）
- 元MIDI bytes + 正規化Song保存
- 保存済みMIDI一覧 / 削除
- IndexedDB unit test 4件
- STORAGE_SPEC
- 読み取り専用Piano Roll
- Piano Roll Track切替 / 4段階横Zoom / 横・縦Scroll
- 小節線 / 拍線 / C音Pitch label
- Piano Roll model unit test 7件
- PIANO_ROLL_SPEC
- 固定binary MIDI fixture Parser integration regression test 2件
- Format 0 / Format 1を実Parser経由で検証

開発中:
- Parser integration regression testを追加済み。次の実装単位はKey / Scale Analyzer

次に実装:
1. Key / Scale Analyzer
2. Chord Analyzer + Degree
3. Melody / Bass / Rhythm基本分析
4. 最小簡易再生（Play / Stop）

既知の問題:
- SMPTE time divisionはv0.1未対応
- Key / Chordの各閾値は仮値
- 6/8等のmusicalBeat表示ルールは分析側で実データ検証が必要
- Import時のroleHintは補助候補であり確定ではない
- 保存済みMIDIの「開く」は未実装（v0.1現在は一覧 / 削除のみ）
- Browser実機でのIndexedDB manual testが必要
- Piano RollのAndroid実機スクロール / 長いMIDI性能テストが必要
- Piano Rollの複合拍子Gridは分母単位。musicalBeat accentは未実装
- Parser fixtureは最小Regression用。RipX / Scaler等の実ファイル検証は別途必要

触らない部分:
- mainを開発用にしない
- 過去Version / 復元Branch
- Demo Composerのproject.json Schema
- 元MIDI由来Noteを分析処理 / Piano Rollで直接変更しない
- `midi-file` raw event modelを `src/midi/` 外へ漏らさない
- 保存OFF時に元MIDI binaryを永続化しない
- v0.1 Piano RollへNote編集を追加しない

最近の重要な設計判断:
- MIDI Parserは `midi-file@1.2.4` を採用し `src/midi/` に隔離
- ViteをBuild Toolとしてのみ導入（Framework導入ではない）
- Storageはnative IndexedDBを利用
- IndexedDB testのみ `fake-indexeddb@6.2.5` を利用
- 保存checkbox初期値はOFF
- 保存ON時のみ元MIDI bytes + Songを端末内へ保存
- Piano RollはNormalized Songだけを読む独立Module
- Piano Rollは1 Track表示。初期Trackは非Drumを優先
- Piano Roll Zoomは4分音符基準。ピンチ依存せず − / ＋ ボタンを使う
- Parser regression fixtureは固定hexをUint8Arrayへ復元して実Parserへ通す
- Motifはv0.2以降
- Track.channel単一前提を廃止し channels[] を採用
- Drum判定はNote.channel === 9を基本とする
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
