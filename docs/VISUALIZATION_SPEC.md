# VISUALIZATION_SPEC.md

## Version
v0.5-dev

## 目的
既存AnalyzerとNormalized Songの結果を、Androidスマートフォンで曲全体の流れとして確認しやすくする。
新しいKey / Chord / Section等の確定判定は行わない。

## Visual Tab
Import後のカテゴリTabに`Visual`を追加する。

### Tonal Center Timeline
- `analyzeStructure().keyTimeline`を表示
- 4小節BlockごとのKey第1候補と一致度
- 確定Keyではなく候補

### Chord Timeline
- `analyzeChords()`の各segmentの第1候補を時間順表示
- Chord Analyzerの順位自体は変更しない

### Melody Contour
- Melody既定Trackの各小節平均Pitch
- Noteがない小節は空欄
- Pitchの良し悪しは評価しない

### Bass Contour
- Bass既定Trackの各小節平均Pitch
- Noteがない小節は空欄

### Rhythm Density
- Rhythm既定Track群の小節ごとのunique onset密度
- 4分音符単位で正規化

### Energy Curve
- 小節ごとの`onset density × average velocity`を曲内最大値で0..1へ正規化
- 音圧・ラウドネスではなくMIDI上の簡易Energy指標

### Section Map
- v0.2 Structure AnalyzerのSection候補を横並び表示
- 4小節Block / similarityを表示

### Note / Velocity Heatmap
- 非Drum NoteをPitch Class × 小節で集計
- CellにNote数、tooltipに平均Velocity
- Android負荷を抑えるため先頭16小節を表示
- 元Noteを変更しない

## UI
- Visual Tab内は縦セクション構成
- Timeline / Contour / Bar Chart / Heatmapは必要に応じて横スクロール
- Canvas必須にせずHTML/CSSで表示
- 長押し・ピンチ必須にしない

## データ
`buildVisualizationModel(song)`は以下を返す。

```text
{
  bars,
  tonalTimeline,
  chordTimeline,
  melody: { trackId, contour },
  bass: { trackId, contour },
  rhythm: { trackIds, bars },
  sections,
  heatmap,
  note
}
```

## 非対応
- waveform / audio loudness
- spectral analysis
- editable visualization
- full-song heatmapの無制限描画
- Analyzer候補の自動確定
