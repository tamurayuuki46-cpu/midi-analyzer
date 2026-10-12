# ANALYSIS_SPEC.md

## Version
v0.1-dev

## 共通思想
- 分析結果は候補として表示
- Candidate / Confidence / Alternative を基本とする
- 良い / 悪いの採点をしない
- 数値には初心者向けの短い説明を添える

---

## 1. Key / Scale

### 対象
Drum Noteを除外。

### 分布
Pitch Classごとに、

`durationTick × velocity`

で重み付け。

### 候補
12根音 × major/minor = 24候補。

上位3候補を表示。

### 拮抗時
上位2候補の差が10%以内を暫定基準とし、
最初 / 最後の和音をヒントとして表示する。

このヒントは順位・confidenceを変更しない。

---

## 2. Chord

### 分析対象Track
v0.1ではユーザーが分析対象Trackを選べる。

例:
- Piano: ON
- Guitar: ON
- Melody: OFF
- Drums: OFF

全Trackを無条件に混ぜない。

### 時間Grid
tickを正本とする。

単純Grid:
`ppq × 4 / denominator`

ただし6/8等の複合拍子では、
- `analysisGrid`: 8分音符等の内部Grid
- `musicalBeat`: 付点4分音符等の音楽的拍
を区別する。

### 拍ごとのPitch Class重み
`window内の重なりduration × velocity`

最低音Pitch ClassにBass Bonusを与える。
初期候補値: 1.5（実データで調整）。

非構成音Penalty係数:
初期候補値: 0.5（実データで調整）。

### Template
- major
- minor
- dim
- aug
- sus2
- sus4
- 7
- maj7
- m7
- m7b5

上位3候補。

構成音が3音未満の場合はconfidenceを下げる。

### 小節集約
隣接拍の第1候補が同じならまとめる。
Chord切替は新候補が旧候補を十分上回った場合のみ。
暫定閾値10%。

---

## 3. Degree

選択中Keyを使用。
Key未選択なら第1候補を仮使用し、

「Key候補: C major の場合」

のように前提を明示する。

音階外Chordは悪いと評価せず、
`♭VII` 等の変化記号 + 「音階外」を表示。

---

## 4. Melody

v0.1:
- 音域
- 最大跳躍
- 平均跳躍
- 同音連打
- リズム密度
- Chord Tone / Non-Chord Tone割合

数値・グラフ中心。
評価文は出さない。

Motifはv0.2以降。

---

## 5. Bass

v0.1:
- 最低音の動き
- Chord Rootとの一致
- 3rd / 5th / Other
- リズムの型

---

## 6. Rhythm

v0.1:
- 拍内発音位置
- シンコペーション候補
- Density
- 16分Grid表示

---

## 7. Chord Tone

Chord Tone / Non-Chord Toneは特徴量。

Non-Chord Toneを誤り扱いしない。

---

## 8. 調整対象パラメータ

実MIDIテストで決める:
- Bass Bonus（仮1.5）
- Non-Chord Penalty（仮0.5）
- Key拮抗閾値（仮10%）
- Chord切替閾値（仮10%）

固定値として仕様化するのはテスト後。
