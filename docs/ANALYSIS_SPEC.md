# ANALYSIS_SPEC.md

## Version
v0.1-dev

## 共通思想
- 分析結果は候補として表示
- Candidate / Confidence / Alternativeを基本とする
- 良い / 悪いの採点をしない
- 数値には初心者向けの短い説明を添える
- `selected`は人が選択したときだけ設定する

## 1. Key / Scale
### 対象
Drum Noteを除外。

### 分布
Pitch Classごとに `durationTick × velocity` で重み付け。

### 候補
12根音 × major/minor = 24候補。上位3候補。

### 拮抗時
上位2候補の差10%以内を暫定基準。始まり / 終わり付近の簡易三和音を補助hintとして表示するが順位は変えない。

## 2. Chord
### 分析対象Track
ユーザーが分析対象Trackを選ぶ。全Trackを無条件に混ぜない。Channel 10 Drumは除外。

### 時間Grid
`analysisGrid = ppq × 4 / denominator`

6/8等では:
- analysisGrid: 8分音符
- musicalBeat: 付点4分音符
を区別する。

画面では同じChordが連続するGridを同一小節内でまとめる。

### 重み
Window内の `overlapDurationTick × velocity`。

最低音Pitch ClassにBass Bonus。初期値1.5。
Non-Chord Penalty初期値0.5。

### Template
- major / minor / dim / aug / sus2 / sus4 / 7 / maj7 / m7 / m7b5

各区間Top 3候補。
構成音3音未満ではconfidenceを下げる。
4音Chordで欠けた構成音も軽くPenaltyする。

### Chord切替
新候補が旧候補を約10%以上上回った場合に切替。閾値は仮値。

## 3. Degree
選択中Keyを使用。
Key未選択なら第1Key候補を仮使用し「Key候補: C major の場合」のように前提を明示。

Chord rootがKey scale外なら `♭VII` 等 + 「音階外」。悪いと評価しない。
Chord qualityの正誤判定はDegreeでは行わない。

## 4. Melody
v0.1:
- 音域
- 最大跳躍 / 平均跳躍
- 同音連打
- リズム密度
- Chord Tone / Non-Chord Tone割合

初期Trackは `roleHint === "melody"` を優先。なければ非Drum Trackの平均Pitchが最も高いTrackを仮選択し、ユーザーが変更できる。

同一Tickの複数Noteは代表Note 1つにまとめる。代表Noteは velocity → duration → pitch の順で優先する。

Chord Tone判定はユーザー選択Chordを優先し、未選択区間はChord第1候補を仮使用する。仮使用時はUIで明示する。

Motifはv0.2以降。

## 5. Bass
v0.1:
- 最低音の動き
- Chord Rootとの一致
- 3rd / 5th / Other
- リズムの型

初期Trackは `roleHint === "bass"` を優先。なければ非Drum Trackの平均Pitchが最も低いTrackを仮選択し、ユーザーが変更できる。

同一Tickに複数Noteがある場合は最低Pitchを代表Bass Noteにする。

Root / 3rd / 5th / Otherは現在のChord候補との関係として表示する。7th等はChord ToneでもBass分類上はOtherに含める。

## 6. Rhythm
v0.1:
- 拍内発音位置
- シンコペーション候補
- Density
- 16分Grid表示

初期TrackはDrum Trackを優先。Drum TrackがなければNoteを持つ全Track。複数Track選択を許可する。

同一Tickの複数Noteは1 onsetとして数える。

シンコペーション候補はv0.1では「musicalBeat拍頭以外のonset」の簡易候補。確定判定ではない。

16分Gridは `ppq / 4` を1 cellとして、小節内の発音位置分布を表示する。

6/8等のcompound meterでは3つのdenominator単位を1 musicalBeatとして扱う。

## 7. Chord Tone
Chord Tone / Non-Chord Toneは特徴量。Non-Chord Toneを誤り扱いしない。

Chord UIが現在のeffective candidateをBasic Analyzerへ渡す。Chord対象Track変更またはChord候補選択時にMelody / BassのChord関係指標を再計算する。

詳細: `docs/BASIC_ANALYSIS_SPEC.md`

## 8. 調整対象パラメータ
実MIDIで調整:
- Bass Bonus（仮1.5）
- Non-Chord Penalty（仮0.5）
- Key拮抗閾値（仮10%）
- Chord切替閾値（仮10%）
- Melody / Bass Track fallback heuristic
- Beat判定許容幅
- シンコペーション候補定義
