# TEST_PLAN.md

## 実装済み自動テスト

### 基礎Regression
- Parser / Normalizer / Storage / Piano Roll
- Key / Chord / Degree / Top 1 Chord Progression
- Melody / Bass / Rhythm Basic Analysis
- Playback Schedule / Controller
- v0.2 Motif / Structure / Modulation / Harmony Detail

### v0.3 Compare / Personal Trend
1. Song summaryがKey / Chord / Melody / Bass / Rhythm指標を返す
2. 同一Song比較で主要delta=0 / Chord共通度=100%
3. 移調した参考曲と自作曲を区別しつつ優劣評価しない
4. 保存済み2曲からPersonal Trendを集計
5. 0曲では空Trendを安全に返す

### v0.4 Part Deep Analysis
1. 2つのmelodic Trackが逆方向に動く例で反行率100%
2. 主旋律の休符区間を裏メロが埋める例と2度衝突候補を検出
3. Bassでペダル傾向 / 12stオクターブ / 1st半音進行を検出
4. GM Drum NoteをKick / Snare / Tom等へ分類し、Tom集中小節をFill候補化
5. roleHint付きTrackをMelody / Chord / Bass / Drums候補として維持

### v0.4.1 / v0.5 Tab UI
1. Tab順序が `overview → harmony → melody → bass → rhythm → structure → visual → compare → library → ai → parts`
2. ArrowLeft / ArrowRightで循環移動する
3. Homeで先頭、Endで末尾へ移動する

### v0.5 Visualization
1. 8小節Songから8本のMelody / Bass ContourとRhythm barを生成する
2. Chord Timeline / Tonal Center Timelineを既存Analyzerから生成する
3. Energy値が0..1へ正規化される
4. Heatmapが12 Pitch Class × 表示小節数のCellを返す
5. Heatmapは非Drum Noteだけを集計する

実行:
```bash
npm test
npm run build
```

## 実MIDIテスト候補
- RipX非Quantize / Scaler・EZkeys Quantize
- 3/4 / 6/8 / Tempo Change
- 主旋律 + 裏メロが別TrackのMIDI
- 裏メロが主旋律の休符を埋めるMIDI
- 半音/全音のBass approachを含むMIDI
- ペダルBass / octave Bass MIDI
- GM Channel 10 Drum / Tom Fill / Crashを含むMIDI
- roleHintが曖昧または欠落した複数Track MIDI
- 参考曲 / 自作曲比較用の2 MIDI
- 保存済み3曲以上のPersonal Trend
- 16小節超のMIDIでHeatmap先頭16小節制限

## Android Manual
- Import / Storage / Play / Stop / Piano Roll
- Key / Chord / Top 1コード進行 / Basic Analysis
- v0.2発展分析
- v0.3比較File picker / Compare cards / Personal Trend
- v0.4 Part Deep Panelが320px幅で崩れない
- Tab列が320px幅で横スクロールできる
- 概要 / Harmony / Melody / Bass / Rhythm / Structure / Visual / Compare / Library / AI / Partsを片手で切替できる
- 選択中Tabが視覚的に分かる
- Tab切替後に各Analyzer内容が欠落しない
- Visual Timeline / Contour / Chart / Heatmapが横スクロールで読める
- Melody / BassのChord Tone系指標がChord選択変更後に再計算される
- Library Tab内で保存済みMIDI一覧と削除が動く
- Import前の保存済みMIDI一覧とImport後のLibraryが二重表示されない
- AI Tabが「準備中」と表示され、未実装AI解析を実行したように見せない
- 裏メロ / Bass / Drum Metricが縦スクロールで読める
- GM Drum Note chipが折り返す
- Track役割候補の長いTrack名がはみ出さない
- 保存 / 削除後にPersonal Trendが再集計される
- 比較用MIDIが保存一覧へ勝手に追加されない

## Regression
Analysis Engine / Playback変更前後で固定MIDIを再解析し、既存結果の意図しない変化がないか確認する。
UI / Visualization変更時もAnalyzerの候補順位・Normalized Song・保存Schemaを変更しない。
アルゴリズム結果変更はCHANGELOGへ記録する。
