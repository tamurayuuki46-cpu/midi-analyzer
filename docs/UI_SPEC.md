# UI_SPEC.md

## 対象
Android Chrome / スマートフォン。

## 画面フロー
Import → 保存選択（初期OFF） → 解析カテゴリTabs → 各カテゴリの詳細。

Import後は1画面へ全解析を縦積みせず、以下のタブへ分ける。

1. 概要
2. Harmony
3. Melody
4. Bass
5. Rhythm
6. Structure
7. Visual
8. Compare
9. Library
10. AI
11. Parts

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
- 主旋律基本分析
- 対象Track選択
- 音域 / 跳躍 / 同音連打 / 密度 / Chord Tone
- 裏メロ候補
- 反行 / 並行 / 斜行 / 主旋律の隙間 / 2度衝突候補 / Register

### Bass
- Bass基本分析
- 対象Track選択
- Root / 3rd / 5th / Other
- ペダル候補
- オクターブ / 半音 / 順次進行
- 次Chord Root接近候補

### Rhythm
- Rhythm基本分析
- 分析対象Track選択
- 拍位置 / 密度 / 16分Grid
- GM Drum分類
- 使用Drum Note
- Fill候補

### Structure
- Motif反復候補
- Section候補
- 区間Key Timeline
- 転調候補

### Visual
- Tonal Center Timeline
- Chord Timeline
- Melody / Bass Contour
- Rhythm Density
- Energy Curve
- Section Map
- Note / Velocity Heatmap
- Timeline / Contour / Chart / Heatmapは必要に応じて横スクロール
- Analyzer候補順位や元Noteを変更しない表示専用Layer

### Compare
- 2 MIDI比較
- 参考曲 vs 現在曲
- Personal Trend

### Library
Library Tabは2ブロックへ分ける。

#### 保存済みMIDI
- IndexedDB `savedMidis`の一覧
- 削除
- Import前は従来どおり画面上に一覧表示
- Import後はLibrary Tab内へ移す

#### Clip Library
- Chord / Melody / Bass / Drum / Motif type select
- 連続4小節Range select
- Clip名（任意）
- Genre（任意）
- Mood（任意）
- custom tag（カンマ区切り）
- `Clipを保存` Button
- BPM / KeyはRangeから自動Tag
- Top 1 Chord progressionをcontextとして保存
- 検索Input
- Clip Card一覧
- Delete Button

Clip Cardには以下を表示する。
- type
- name
- source fileName
- Range
- Note数
- Chord progression（存在する場合）
- Genre / Mood / BPM / Key / custom tags

検索は複数token AND。Chord名も検索対象。
削除はconfirm後に実行する。

### AI
- v0.6では自動AI解析を実行しない
- 「準備中」と表示する
- 将来、Key / Chord / 転調の理由説明、参考曲から学べる点、作曲への応用候補を配置する

### Parts
- Track役割候補
- Melody / Chord / Bass / Drums / Other
- 候補表示のみでNormalized SongのroleHintを自動変更しない

## Tab操作
- Androidではタブ列を横スクロール可能にする
- タップ領域は44px以上
- 選択中タブを明確に表示する
- 非選択tabpanelは`hidden`で非表示にする
- WAI-ARIAの`tablist` / `tab` / `tabpanel`を使用する
- キーボードでは左右矢印で移動、Homeで先頭、Endで末尾へ移動できる
- 初期タブは「概要」

## Playback UI
- 概要タブへ配置
- Play / Stopのみ
- 各ボタン52px以上のタップ領域
- Play開始中は二重Playを無効化
- Stop時はAudioContextを閉じて即停止
- 再生時間 / Note数 / 状態を表示
- Tempo Mapは反映
- 通常Noteは簡易シンセ、Channel 10はclick音
- 元の楽器音色を再現しないことを明記
- Pause / Seek / Loop / Tempo変更 / 音色選択は現段階では置かない

## Key UI
- Top 3候補
- confidenceは一致度
- 自動確定しない
- Candidateをタップしたときだけ選択状態

## Chord / Degree UI
- Noteを持つ非Drum Trackをcheckboxで分析対象にする
- `roleHint=chord`がある場合は初期ON
- 候補は小節内のChord区間ごとにTop 3
- Candidateボタンは44px以上のタップ領域
- Chord名 / Degree / 一致度を同時表示
- 各区間ランキング1位をTop 1仮コード進行として時間順に表示
- Key未選択時は「Key候補 X の場合」と明記
- Key選択変更時はDegree表示だけを更新できる
- 音階外Degreeには「音階外」を表示するが警告色で誤り扱いしない
- Track選択変更時はChord解析をやり直し、以前のChord選択を解除する

## Melody / Bass / Rhythm UI
- Melody / Bassはselectで対象Track変更
- Rhythmはcheckboxで複数Track選択
- Chord候補選択 / Chord Track変更時にMelody / BassのChord Tone系指標を再計算
- 16分Gridはスマホ幅で折り返す
- 特徴量を良い / 悪いとして採点しない

## Piano Roll UI
- 概要タブ内
- 読み取り専用
- 1 Track表示
- `− / ＋` Zoom、横時間Scroll / 縦Pitch Scroll
- Note移動 / 長さ変更 / Quantizeなし

## Android原則
- 片手操作
- タップ領域を広く
- 小さすぎる文字を避ける
- 長押し / ピンチ必須にしない
- タブ列とPiano RollとVisualの長いTimelineは必要に応じて横スクロール
- Clip Library Formは560px以下で1column
- Clip Delete Buttonはmobile幅で押しやすくする
- 各タブ内は縦スクロール中心
- 1タブ内へ無関係な解析を詰め込みすぎない
