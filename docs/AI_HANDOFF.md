# AI_HANDOFF.md

現在Version:
v0.1-dev

最新安定版:
未作成

現在実装済み:
- 初期Repository / 共通仕様書
- MIDI Schema v0.1 / Analysis仕様 v0.1
- MIDI Import / Parser Adapter / Song正規化
- Tempo / 拍子 / Track / RipX origin / Warning
- Normalizer unit test 7件
- GitHub Actions CI
- IndexedDB端末保存（初期OFF）/ 一覧 / 削除
- IndexedDB unit test 4件 / STORAGE_SPEC
- 読み取り専用Piano Roll / Track切替 / Zoom / Scroll
- Piano Roll model unit test 7件 / PIANO_ROLL_SPEC
- 固定binary MIDI Parser integration regression test 2件
- Key / Scale Analyzer
- major / minor 24候補 → Top 3
- durationTick × velocity Pitch Class重み
- Drum除外 / confidence / 拮抗時edge harmony hint
- Key候補ユーザー選択UI
- Key Analyzer unit test 6件
- KEY_ANALYZER_SPEC

開発中:
- Key / Scale Analyzer実装済み。次の実装単位はChord Analyzer + Degree

次に実装:
1. Chord Analyzer + Degree
2. Melody / Bass / Rhythm基本分析
3. 最小簡易再生（Play / Stop）

既知の問題:
- SMPTE time divisionはv0.1未対応
- Key拮抗閾値10%は仮値
- Key profile / confidenceは実MIDIで調整が必要
- Keyは現時点で全曲1つの候補。Section別Keyは未対応
- Key edge harmony hintは簡易三和音検出で、正式Chord Analyzer結果ではない
- Chord各閾値は仮値
- 6/8等のmusicalBeat表示ルールは分析側で実データ検証が必要
- 保存済みMIDIの「開く」は未実装
- Android実機でStorage / Piano Roll / Key UI manual testが必要
- RipX / Scaler等の実ファイルRegressionは別途必要

触らない部分:
- mainを開発用にしない
- 過去Version / 復元Branch
- Demo Composerのproject.json Schema
- 元MIDI由来Noteを分析処理 / Piano Rollで直接変更しない
- `midi-file` raw event modelを `src/midi/` 外へ漏らさない
- 保存OFF時に元MIDI binaryを永続化しない
- v0.1 Piano RollへNote編集を追加しない
- AnalyzerがKeyを自動確定しない

最近の重要な設計判断:
- MIDI Parserは `midi-file@1.2.4` を `src/midi/` に隔離
- Storageはnative IndexedDB
- Piano RollはNormalized Songだけを読む独立Module
- Parser fixtureは固定hexを実Parserへ通す
- Key AnalyzerはNormalized Songだけを読む
- Key weight = durationTick × velocity
- Channel 10 DrumはKey分析から除外
- major/minor固定profileとのCosine Similarityをconfidenceとして使用
- confidenceは確率ではない
- 上位3候補を返し、selectedは解析時null
- 上位2候補が10%以内ならedge harmony補助hint。ただし順位は変更しない
- Motifはv0.2以降
- Chord分析対象Trackはユーザー選択
- 6/8ではanalysisGridとmusicalBeatを分離
- v0.1 UIに一般Exportを置かない

現在のMIDI Schema:
schemaVersion "0.1"
Note: id, pitch, startTick, durationTick, velocity, trackId, channel, origin
Track: id, name, channels[], noteCount, isDrums, roleHint
Song: schemaVersion, source, ppq, tempoMap, timeSignatures, lengthTicks, tracks, notes
Import Result: { song, warnings }

現在のAnalysis Result:
Key: { candidates: [{ value, confidence }], selected: null, note, hint }
selectedは人が選択した場合のみUI stateで設定。自動解析では確定しない。

現在のStorage Schema:
IndexedDB `midi-analyzer` / version 1 / store `savedMidis`
record: storageSchemaVersion, id, savedAt, source, midiBytes, song, warnings

最終更新:
2026-10-12
