# INSIGHT_ANALYSIS_SPEC.md

## Version
v0.23-dev

## 目的
既存Analyzerが出したEvidenceを、初心者が「この曲のどこを見るか」を判断しやすい形へまとめる。

v0.23のInsight Layerは、分析結果を**要約・比較するRead-only Layer**である。品質、人気、正解、不正解を採点しない。元MIDI、Normalized Song、SongProject、保存済みデータを変更しない。

## 1. Phrase contour / Peak / Climax候補
Melodyの代表Note列を時間順に見て、次を表示する。

- Phrase contour: `arch / valley / ascending / descending / mixed`
- Melody音域
- 方向転換回数
- 最高音と曲内位置
- 最低音
- Climax候補

Climax候補は次のEvidenceを組み合わせる。

- Pitchの高さ
- Velocity
- 周辺発音密度

内部の重みは候補順位を安定させるためだけに使い、ユーザーへ品質Scoreとして表示しない。

## 2. Section間 Landing比較
既存Structure AnalyzerのSection候補ごとに、Section内最後の代表Melody Noteを着地候補として比較する。

表示するEvidence:

- Section label / 小節範囲
- Pitch / Pitch name
- Keyに対するDegree
- Chord Tone / Scale Tone関係
- Chord候補
- strong / weak beat context

Section labelはA/B/C等の解析候補のまま扱い、Verse / Pre-Chorus / Chorus等へ自動確定しない。

## 4. Reference MIDI vs Own MIDI 差分説明
既存Compare Analyzerの数値差を、最大5件の説明へ変換する。

対象:

- Melody音域
- Melody密度
- Melody平均跳躍
- Bass平均移動
- Bass Root率
- Rhythm密度
- 拍頭率
- 全体Note密度
- 転調候補数
- Top Key候補
- Chord集合共通度

説明は「参考より広い / 狭い」「多い / 少ない」等の観測に限定する。「良い」「悪い」「近づけるべき」とは判定しない。

比較用Reference MIDIは既存仕様どおり自動保存しない。

## 5. 曲全体の特徴 Top 5
次のEvidence候補から、特徴として差が出やすいものを最大5件だけ選ぶ。

- Melody最高音位置
- Phrase contour
- Section landing傾向
- Non-Chord Tone Resolution傾向
- Section Note密度差
- 転調候補
- Chord Tone率

各項目は次の3要素で表示する。

1. Feature title
2. Evidence
3. Meaning

内部ランキング用weightはUI/APIへ品質Scoreとして公開しない。

## UI
### Structure Tab
次を追加する。

- `Phrase contour / Peak / Climax候補`
- `Section間 Landing比較`
- `曲の特徴 Top 5`

### Compare Tab
既存の数値比較の上に `違いの要点` を追加する。

Android Chromeを優先し、360 / 390 / 430pxで横スクロールを発生させない。

## データ安全性
- Normalized Songを変更しない
- 元MIDIを変更しない
- SongProject v1 Schemaを変更しない
- IndexedDB v3を変更しない
- Key / Chord / Section候補順位を変更しない
- 自動作曲、自動編曲、自動Note修正をしない
- Reference MIDIを自動保存しない

## テスト
- Phrase Peak / Climax Evidence
- Section landing Degree / Chord relation
- Top Characteristicsが最大5件
- Top Characteristicsの内部weight非公開
- Reference差分説明が最大5件
- 同一曲比較の回帰
- 元Song非破壊
- Production build
- Basic Pitch local model assets
- Mobile Chromium 360 / 390 / 430px

## 今後
- Climax候補の実曲チューニング
- Section名をユーザーが確定した場合のVerse/Bメロ/Chorus比較
- 解決速度・解決方向のReference比較
- 実曲コーパスでTop5順位の調整
