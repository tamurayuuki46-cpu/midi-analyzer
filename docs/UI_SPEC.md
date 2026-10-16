# UI_SPEC.md

## 対象
Android Chrome / スマートフォン。

## v0.26 Analyzer / Archive
最上部で `Analyzer` / `Archive` を切り替える（hash `#analyzer` / `#archive`、44px以上）。
- Analyzer: Import（保存OFF）→ 今回の目的 → 今見る3つ（最大3件）→ 初心者モード → 詳細モード（下記12タブ）。
- Archive: Import（保存ON）→ Audio→MIDI / Note修正 / Stem → 保存済みMIDI → 開いている曲のClip Library・Key変更。
- 下記の「14タブ」のうち Library はArchiveへ移動し、Analyzerの詳細タブは12個（Recorderは退役済み）。

## 画面フロー
Import → 保存選択（初期OFF） → 解析カテゴリTabs → 各カテゴリの詳細。

Import後は1画面へ全解析を縦積みせず、以下の14タブへ分ける。

1. 概要
2. Harmony
3. Melody
4. Bass
5. Rhythm
6. Structure
7. Visual
8. Compare
9. Library
10. Recorder
11. Export
12. AI
13. Metrics
14. Parts

## Tab構成
### 概要
- ImportしたMIDIの基本情報
- 簡易再生 Play / Stop
- Track一覧
- Piano Roll
- Import warning

### Harmony
- Key / Scale候補
- Chord / Degree
- Top 1仮コード進行
- Chord Detail
- 転回形 / Slash Chord / Tension候補

### Melody
- 主旋律基本分析 / 対象Track
- 音域 / 跳躍 / 同音連打 / 密度 / Chord Tone
- 裏メロ候補
- 反行 / 並行 / 斜行 / 主旋律の隙間 / 2度衝突候補 / Register

### Bass
- Bass基本分析 / 対象Track
- Root / 3rd / 5th / Other
- ペダル / オクターブ / 半音 / 順次進行
- 次Chord Root接近候補

### Rhythm
- Rhythm基本分析 / 対象Track
- 拍位置 / 密度 / 16分Grid
- GM Drum分類 / 使用Note / Fill候補

### Structure
- Motif反復候補
- Section候補
- 区間Key Timeline
- 転調候補

### Visual
- Tonal Center Timeline
- Chord Timeline
- Melody / Bass Contour
- Rhythm Density / Energy Curve
- Section Map
- Note / Velocity Heatmap
- 長い可視化は必要に応じて横スクロール

### Compare
- 2 MIDI比較
- 参考曲 vs 現在曲
- Personal Trend

### Library
- 保存済みMIDI
- Chord / Melody / Bass / Drum / Motif Clip Library
- 4小節Range / Genre / Mood / custom tag
- BPM / Key自動Tag
- Top 1 Chord progression context
- AND検索 / 削除

### Recorder
- Melody / Chord / Bass / Drum Part select
- Partごとの既定Track checkbox / 手動Track選択
- Take名 / Monitor ON/OFF
- REC / STOP
- Saved Take / Preview / A-B / Audio書き出し / 削除

RecorderはMIDI Analyzer内の簡易音源を選択TrackだけSolo再生し、そのAudioをMediaRecorderへ録音する。
他アプリ内部Audioやマイク入力を録音するUIではない。

### Export
- Analysis JSON
- Analysis CSV
- Markdown Report
- Chord / Degree Text
- Demo Composer Schema 3 `project.json`
- 対応端末の共有メニュー
- PPQ / 4/4等の変換Warning
- 自動Uploadなし

### AI
- 端末内Explainability
- なぜこのKey候補か
- Chord進行の読み方
- 転調候補の読み方
- この曲から学べること
- 作曲へ応用する候補
- 外部AIへ手動で渡すPrompt file Export
- 外部AIへMIDI / Analysisを自動送信しない

### Metrics
- 浮遊感候補
- サビらしさ候補 / Section ranking
- 驚き度 / 転調Impact候補
- 反復と変化のBalance候補
- 裏メロ存在感候補
- 編曲密度候補
- 0〜100 Score / Summary / Evidence
- 品質・人気・正解の採点ではないことを常時明記

### Parts
- Track役割候補
- Melody / Chord / Bass / Drums / Other
- 候補表示のみでNormalized SongのroleHintを自動変更しない

## Tab操作
- Androidではタブ列を横スクロール可能にする
- タップ領域は44px以上
- 選択中タブを明確に表示する
- 非選択tabpanelは`hidden`
- WAI-ARIA `tablist` / `tab` / `tabpanel`
- 左右矢印で移動、Homeで先頭、Endで末尾
- 初期タブは「概要」

## Playback UI
- 概要タブへ配置
- Play / Stop
- Play開始中は二重Playを無効化
- Stop時はAudioContextを閉じて即停止
- Tempo Map反映
- 通常Noteは簡易シンセ、Channel 10はclick音
- 元音色再現ではないことを明記

## Recorder UI
- REC / STOPは44px以上
- REC中はREC disabled、STOP有効
- STOP後または曲末でTake保存
- Monitor OFFはspeaker出力だけ止め録音継続
- MediaRecorder非対応時はRecorderだけdisabled
- IndexedDB非対応時はTake保存disabled
- 再Import時に旧Recorder Controller破棄
- Audio書き出し拡張子はmimeTypeに従う

## Export UI
- 1操作1ファイルで迷いにくくする
- Demo Composer変換WarningをButtonの近くへ表示
- navigator.share非対応なら共有Buttonをdisabled
- Downloadは通常Buttonとして常に使える

## AI / Metrics UI
- Explainabilityを外部AI実行と誤認させない
- Metric CardはLabel / Score / Bar / Summary / Evidenceを同時表示
- 色だけに意味を持たせず数値とTextも表示

## Key / Chord UI
- Top 3候補
- confidenceは一致度で確率ではない
- 自動確定しない
- Chordは分析Trackを選択可能
- Top 1仮コード進行を時間順表示
- Degree / 音階外候補を表示

## Melody / Bass / Rhythm UI
- Melody / Bassはselectで対象Track変更
- Rhythmはcheckboxで複数Track選択
- Chord選択変更時にMelody / BassのChord Tone系指標を再計算
- 特徴量を良い / 悪いとして採点しない

## Piano Roll UI
- 概要タブ内 / 読み取り専用
- Track切替 / Zoom / Scroll
- Note編集 / Quantizeなし

## Android原則
- 片手操作
- 44px前後以上のタップ領域
- 小さすぎる文字を避ける
- 長押し / ピンチ必須にしない
- タブ列 / Piano Roll / Visualは必要に応じてローカル横スクロール
- Clip Library / Recorder / Exportは560px以下で1column
- 各タブ内は縦スクロール中心
- v1.0で14タブ全体の情報設計を最終整理する
