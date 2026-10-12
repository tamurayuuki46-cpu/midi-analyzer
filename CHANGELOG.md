# CHANGELOG

## Version: v0.1-dev
更新日: 2026-10-12

### 【追加】
- 初期Repository / 共通仕様書 / AI共同開発ルール
- MIDI Import / `midi-file@1.2.4` Parser Adapter / Song正規化
- Tempo Map / Time Signature / Track一覧 / Warning
- Normalizer unit test 7件 / GitHub Actions CI
- IndexedDB端末保存（初期OFF）/ 元MIDI + Song / 一覧 / 削除
- IndexedDB unit test 4件 / STORAGE_SPEC
- 読み取り専用Piano Roll / Track切替 / Zoom / Scroll
- Piano Roll model unit test 7件 / PIANO_ROLL_SPEC
- 固定binary MIDI Parser integration regression test 2件
- Key / Scale Analyzer（major/minor 24候補 → Top 3）
- durationTick × velocityによるPitch Class重み
- Key Analyzer Drum除外 / confidence / 拮抗時補助hint
- Key候補のユーザー選択UI
- Key Analyzer unit test 6件
- `docs/KEY_ANALYZER_SPEC.md`

### 【変更】
- Motifはv0.2以降
- Trackは `channels[]`、DrumはNote.channel === 9を基本判定
- 6/8ではanalysisGridとmusicalBeatを分離
- 保存失敗とImport失敗を分離
- Key confidenceは確率ではなくprofile一致度として表示

### 【修正】
- Claude引き継ぎ案と既存仕様の矛盾整理
- mixed Channel TrackのDrum表示
- PWA manifest path

### 【未対応】
- Chord Analyzer + Degree
- Melody / Bass / Rhythm Analyzer
- 最小簡易再生
- 実MIDIによるKey / Chord係数調整
