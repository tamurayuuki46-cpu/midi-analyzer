# HIGHER_METRICS_SPEC.md

## Version
v0.9-dev

## 目的
複数Analyzerの結果を、曲全体の特徴を比較しやすい0〜100の候補Scoreへまとめる。
Scoreは音楽的品質・人気・正解を採点しない。

## 共通原則
- 0〜100へclamp
- 元Song / Analyzer候補順位を変更しない
- ScoreだけでなくEvidenceを必ず表示する
- 実MIDI検証で将来係数調整可能なheuristicとする
- 歌詞 / Audio timbre / Mix loudnessを推定しない

## 1. 浮遊感候補
入力:
- maj7 / m7 / sus2 / sus4 / aug / m7b5等の色付きChord候補比
- Melody非Chord Tone候補比
- 転調候補数
- Melody平均跳躍から得るsmooth-motion成分

概念式:
`0.45*color + 0.25*nonChord + 0.20*modulation + 0.10*smoothMotion`

「浮遊感がある」と断定せず、調中心を曖昧に感じさせ得る材料の量として扱う。

## 2. サビらしさ候補
4小節Section候補間で以下を相対正規化する。
- Note density: 40%
- average Velocity: 35%
- average Pitch/Register: 25%

各Sectionを0〜100でrankingし、最高Sectionを「サビらしさ候補」と表示する。
A/B/C LabelをVerse/Chorusへ自動変換しない。

## 3. 驚き度 / 転調Impact候補
入力:
- 転調relationのImpact候補
- 転調confidence
- Top 1 Chordの音階外候補比

relation重みは relative / parallelを低め、semitone / otherを高めに置く。
これは聴取者の心理的驚きを測定した値ではない。

## 4. 反復と変化のBalance候補
入力:
- Motif repetition coverage
- Section Label種類比

反復と変化が両方活動している場合にBalance Scoreを上げる。
単純に50:50を品質上の理想とは扱わない。

## 5. 裏メロ存在感候補
入力:
- Counter Melody候補Trackの有無
- motion evaluated区間
- 主旋律休符へのgap use
- Evidenceとして反行率も表示

Counter Trackがなければ0。
存在感Scoreは良し悪しではなく、MIDI上でどの程度独立活動があるかの候補。

## 6. 編曲密度候補
入力:
- 全Note / quarter
- 活動Track数
- Track候補の平均polyphony tendency

Audio loudness / Mix densityではなくMIDI event上の密度。

## UI
Metrics Tabで各Cardに表示:
- Label
- Score /100
- Bar
- Summary
- Evidence list

Section別サビらしさ候補は別一覧表示する。

## Export
Markdown ReportへHigher-level Metricsを含める。
AI Explainabilityもこれらを作曲への応用候補生成に使用する。

## Testing
- 全Scoreが整数0〜100
- 全MetricにLabel / Evidenceがある
- Section候補があればchorusCandidatesを返す
- 同じSong入力で決定論的
- 元Songを変更しない

## 継続検証
v1.0前後で実MIDI corpusを用い、係数と閾値を調整する。
係数変更時はCHANGELOGへ記録する。
