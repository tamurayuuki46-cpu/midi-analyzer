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
- Key / Scale Analyzer / major-minor 24候補 → Top 3
- Key候補ユーザー選択UI / Key Analyzer unit test 6件 / KEY_ANALYZER_SPEC
- Chord Analyzer + Degree
- Chord分析対象Track選択UI
- 12 root × 10 Chord Template / Top 3候補
- overlap duration × velocity重み
- Bass Bonus / Non-Chord Penalty / sparse chord confidence reduction
- Chord切替閾値10% / 同一小節内の連続Chord集約
- 選択Keyまたは第1Key候補を基準にDegree表示
- 音階外Degree表示
- Chord Analyzer unit test 10件
- CHORD_ANALYZER_SPEC

開発中:
- Chord Analyzer + Degree実装済み。次はMelody / Bass / Rhythm基本分析

次に実装:
1. Melody / Bass / Rhythm基本分析
2. 最小簡易再生（Play / Stop）
3. Android実機と実MIDIでKey / Chord係数調整

既知の問題:
- SMPTE time divisionはv0.1未対応
- Key拮抗閾値10%は仮値
- Key profile / confidenceは実MIDIで調整が必要
- Keyは全曲1候補でSection別Key未対応
- Chord Bass Bonus 1.5 / Non-Chord Penalty 0.5 / 切替10%は仮値
- slash chord専用表記は未対応
- 6/8等のmusicalBeat accent表示は未対応
- 保存済みMIDIの「開く」は未実装
- Android実機でStorage / Piano Roll / Key / Chord UI manual testが必要
- RipX / Scaler / EZkeys等の実ファイルRegressionは別途必要

触らない部分:
- mainを開発用にしない
- 過去Version / 復元Branch
- Demo Composerのproject.json Schema
- 元MIDI由来Noteを分析処理 / Piano Rollで直接変更しない
- `midi-file` raw event modelを `src/midi/` 外へ漏らさない
- 保存OFF時に元MIDI binaryを永続化しない
- v0.1 Piano RollへNote編集を追加しない
- AnalyzerがKey / Chordを自動確定しない

最近の重要な設計判断:
- MIDI Parserは `midi-file@1.2.4` を `src/midi/` に隔離
- Storageはnative IndexedDB
- Piano RollはNormalized Songだけを読む独立Module
- Key Analyzer weight = durationTick × velocity / Channel 10除外
- Chord AnalyzerはNormalized Songだけを読む
- Chord分析対象Trackはユーザー選択
- Chord weight = window overlapDurationTick × velocity
- Bass Bonus 1.5 / Non-Chord Penalty 0.5 / 切替閾値10%は暫定
- 6/8ではanalysisGridとmusicalBeatを分離
- Chord候補Top 3を表示しselectedはUIで人が選択
- Degreeは選択Key、未選択なら第1Key候補を仮基準にする
- 音階外Degreeは表示するが評価しない
- Motifはv0.2以降
- v0.1 UIに一般Exportを置かない

現在のMIDI Schema:
schemaVersion "0.1"
Note: id, pitch, startTick, durationTick, velocity, trackId, channel, origin
Track: id, name, channels[], noteCount, isDrums, roleHint
Song: schemaVersion, source, ppq, tempoMap, timeSignatures, lengthTicks, tracks, notes
Import Result: { song, warnings }

現在のAnalysis Result:
Key: { candidates: [{ value, confidence }], selected: null, note, hint }
Chord: { trackIds, segments: [{ id, startTick, endTick, barNumber, candidates, selected }], selected: null, note, parameters }
selectedは人が選択した場合のみUI stateで設定。自動解析では確定しない。

現在のStorage Schema:
IndexedDB `midi-analyzer` / version 1 / store `savedMidis`
record: storageSchemaVersion, id, savedAt, source, midiBytes, song, warnings

最終更新:
2026-10-12
