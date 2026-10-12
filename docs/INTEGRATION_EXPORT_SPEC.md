# INTEGRATION_EXPORT_SPEC.md

## Version
v0.9-dev（v0.7 Integration / Export scope）

## 目的
MIDI Analyzerの解析候補を、ユーザーの明示操作で外部利用できる形式へ書き出す。
元MIDI / Normalized Song / Analyzerの候補順位は変更しない。

## Export Tab
以下を1タップで生成する。

- Analysis JSON
- Analysis CSV
- Markdown Report
- Chord / Degree Text
- Demo Composer互換 `project.json`
- 対応端末では共有メニュー

すべてローカル生成し、自動Uploadは行わない。

## Analysis Bundle
`buildAnalysisBundle(song)` をExport / Explainability / Metricsの共通入力とする。

含むもの:
- source / tempo / meter / ppq / trackCount / noteCount
- Key候補
- Chord候補 / Top 1 progression
- Melody / Bass / Rhythm
- Motif
- Structure / modulation candidates
- Counter Melody / Bass Detail / Drum Detail / Part candidates

Bundleは元Songを変更しない。

## Demo Composer Adapter
正本: Demo Composer `docs/DATA_SCHEMA.md` / Schema 3。

出力:
- `schemaVersion: 3`
- Demo Composer互換 `metadata / basic / structure / chords / tracks / instruments / progress / exportSettings`
- `basic.ppq = 480`
- `basic.timeSignature = 4/4`

### Tick変換
元PPQが480以外の場合:

`demoTick = round(sourceTick * 480 / sourcePPQ)`

startTick / durationTickの両方へ適用する。durationTickは最低1tick。

### Key表記
Analyzer:
`C, C♯, D, E♭, E, F, F♯, G, A♭, A, B♭, B`

Demo Composer:
`C, C#, D, D#, E, F, F#, G, G#, A, A#, B`

Pitch Classを維持して表記だけ変換する。

### Chord Quality変換
- major → major
- minor → minor
- dim → diminished
- aug → augmented
- sus2 → sus2
- sus4 → sus4
- 7 → dominant7
- maj7 → major7
- m7 → minor7
- m7b5 → minor7flat5

DegreeはDemo Composer validatorが空文字を許可しないため、選択Key候補に基づき必ず文字列を生成する。

### Track変換
候補Trackを次へ変換する。
- Melody → role `melody`, channel 2
- Counter Melody → role `counter`, channel 4
- Bass → role `bass`, channel 3
- Drums → role `drums`, channel 10

Track候補はAnalyzer heuristicなので、Demo Composer側で再選択可能な初期値として扱う。

### Section
AnalyzerのA/B/Cは「類似Block候補」であり、Verse / Chorus等の形式名ではない。
そのため `structure.sections` へ自動確定しない。

### Warning
以下はExport時にWarning表示する。
- Key候補がない → C major fallback
- 元MIDIが4/4以外
- 元PPQが480以外

## JSON
解析Bundleを読みやすいJSONへ保存する。

## CSV
Key / Chord / Section / Modulation候補を1行1項目で保存する。
列:
`category,index,bar,startTick,endTick,label,value,confidence,detail`

## Markdown
人が読むReport。Key / Chord / Structure / Modulation / Higher-level Metrics / 学べること / 応用候補を含む。

## Chord / Degree Text
小節単位でTop 1候補とDegreeを簡易Text化する。

## 共有メニュー
`navigator.share` + File共有に対応する端末だけ有効化する。
未対応端末では通常Downloadを使う。

## Privacy
- 自動Uploadなし
- API Key不要
- Exportはユーザー操作時のみ
- Demo Composerへ自動送信せず、ファイル/共有メニュー経由で明示受け渡し

## Scope外
- v1.0での双方向同期
- Demo Composerの既存Projectへの自動Merge
- Cloud DB同期
