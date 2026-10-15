# ANALYSIS_SPEC.md

## Version
v0.20-dev

## 共通思想
- 分析結果は候補として表示
- Candidate / Confidence / Alternativeを基本とする
- 良い / 悪いの採点をしない
- 数値には初心者向けの短い説明を添える
- `selected`は人が選択したときだけ設定する
- 初心者表示は `Metric → Meaning → Action` を基本形とする
- Actionは任意の実験案であり、採用・実行を強制しない
- 参考曲は具体的なNote列 / Chord列ではなく、音域・動き・密度・反復など抽象化した特徴として扱う
- Chord Tone / Non-Chord ToneとScale Tone / Non-Scale Toneを混同しない
- 外音を誤りや低品質として扱わない

## 0. Metric → Meaning → Action / Reference → Action

v0.20-devでは初心者モードの主要Metricを、単なる数値表示で終わらせない。

### Metric
既存Analyzerが計算した観測値・候補値。例: Key候補、音域、平均跳躍、拍頭以外率、Motif候補数、Chord Tone率、Scale Tone率。

### Meaning
Metricが示す音楽的な特徴を短く説明する。品質評価には変換しない。

例:
- 音域が狭い → 会話的・反復的な輪郭を作りやすい特徴
- 跳躍が多い → 輪郭のアクセントになっている特徴
- 拍頭以外が多い → 前へ引っ張る感じや細かな動きを作りやすい特徴
- Chord外・Scale内 → 和音構成音ではないがKeyの音階には含まれる音

### Action
元案を壊さず試せる実験候補を最大2件/Metric程度示す。Actionを選ばず現在の特徴を維持すること、保留することも正式な選択肢とする。

### Reference → Action
参考曲からは具体的なNote列 / Chord列を自作曲へコピーしない。以下のような抽象特徴だけを自分の曲で試す。

- Sectionで音域が広がるか
- なめらか / 跳躍が多い等の旋律傾向
- 拍頭中心 / 拍外が多い等の発音位置傾向
- 短い形を反復する / 変化を増やす等のモチーフ運用
- Chord ToneとScale Toneをどの比率で使うか

AnalyzerはComposition ownerではないため、ActionはDemo Composer等で人が試すための判断材料に留める。

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
v0.1から継続:
- 音域
- 最大跳躍 / 平均跳躍
- 同音連打
- リズム密度
- Chord Tone / Non-Chord Tone割合

v0.20追加:
- Scale Tone / Non-Scale Tone割合
- Chord ToneとScale Toneの組み合わせ
- Chord外・Scale内
- Chord内・Scale外
- 両方の外側

初期Trackは `roleHint === "melody"` を優先。なければ非Drum Trackの平均Pitchが最も高いTrackを仮選択し、ユーザーが変更できる。

同一Tickの複数Noteは代表Note 1つにまとめる。代表Noteは velocity → duration → pitch の順で優先する。

Chord Tone判定はユーザー選択Chordを優先し、未選択区間はChord第1候補を仮使用する。仮使用時はUIで明示する。

Scale Tone判定は選択Keyを優先し、未選択時はKey第1候補を仮使用する。majorはmajor scale、minorはnatural minorを基本基準とする。harmonic / melodic minor由来のraised 6th / 7th等を誤りとは判定しない。

Motifは既存Structure Analyzerで扱う。

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
Chord Tone / Non-Chord Toneは「その瞬間のChord構成音との関係」を示す特徴量。Non-Chord Toneを誤り扱いしない。

Chord UIが現在のeffective candidateをBasic Analyzerへ渡す。Chord対象Track変更またはChord候補選択時にMelody / BassのChord関係指標を再計算する。

詳細: `docs/BASIC_ANALYSIS_SPEC.md`

## 8. Note Function: Chord Tone × Scale Tone

v0.20-devではChord ToneとScale Toneを独立判定する。

### Scale Tone
現在のKey / Scale候補に含まれるPitch Classかを判定する。

### Chord Tone
現在のChord effective candidateの構成音に含まれるPitch Classかを判定する。

### 組み合わせ
- **両方に含まれる**: Chord ToneかつScale Tone
- **Chord外・Scale内**: Non-Chord ToneだがScale Tone
- **Chord内・Scale外**: Chord ToneだがNon-Scale Tone
- **両方の外側**: Non-Chord ToneかつNon-Scale Tone

上記4分類を正誤・優劣へ変換しない。Passing / Neighbor / Approach等の機能名は、時間方向・前後関係を十分に判定できる段階までは断定しない。

HarmonyでKey / Chord候補を選択した場合、Note Function表示を再計算する。未選択候補を仮使用した場合は、その前提をUIへ明示する。

詳細: `docs/NOTE_FUNCTION_ANALYSIS.md`

## 9. 調整対象パラメータ
実MIDIで調整:
- Bass Bonus（仮1.5）
- Non-Chord Penalty（仮0.5）
- Key拮抗閾値（仮10%）
- Chord切替閾値（仮10%）
- Melody / Bass Track fallback heuristic
- Beat判定許容幅
- シンコペーション候補定義
- minor時のScale Tone表示方針（natural / harmonic / melodic minorの扱い）
