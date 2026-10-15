# ANALYSIS_SPEC.md

## Version
v0.22-dev

## 共通思想
- 分析結果は候補として表示
- Candidate / Confidence / Alternative / Evidenceを基本とする
- 良い / 悪いの採点をしない
- 数値には初心者向けの短い説明を添える
- `selected`は人が選択したときだけ設定する
- 初心者表示は `Metric → Meaning → Action` を基本形とする
- Actionは任意の実験案であり、採用・実行を強制しない
- 参考曲は具体的なNote列 / Chord列ではなく、音域・動き・密度・反復など抽象化した特徴として扱う
- Chord Tone / Non-Chord ToneとScale Tone / Non-Scale Toneを混同しない
- Passing / Neighbor / Approach / Resolution / Suspension / Anticipationは確定ではなく候補として扱う
- 外音を誤りや低品質として扱わない
- AnalysisはNormalized Songを変更しない

## 0. Metric → Meaning → Action / Reference → Action

### Metric
既存Analyzerが計算した観測値・候補値。例: Key候補、音域、平均跳躍、拍頭以外率、Motif候補数、Chord Tone率、Scale Tone率、Passing候補数、Resolution候補数。

### Meaning
Metricが示す音楽的な特徴を短く説明する。品質評価には変換しない。

例:
- 音域が狭い → 会話的・反復的な輪郭を作りやすい特徴
- 跳躍が多い → 輪郭のアクセントになっている特徴
- 拍頭以外が多い → 前へ引っ張る感じや細かな動きを作りやすい特徴
- Chord外・Scale内 → 和音構成音ではないがKeyの音階には含まれる音
- Passing候補 → 2つのChord Tone間をStepでつなぐ可能性がある音
- Resolution候補 → Chord外音の後、近い時間内にChord Toneへ進む動き

### Action
元案を壊さず試せる実験候補を最大2件/Metric程度示す。Actionを選ばず現在の特徴を維持すること、保留することも正式な選択肢とする。

### Reference → Action
参考曲から具体的なNote列 / Chord列を自作曲へコピーしない。以下のような抽象特徴だけを自分の曲で試す。
- Sectionで音域が広がるか
- なめらか / 跳躍が多い等の旋律傾向
- 拍頭中心 / 拍外が多い等の発音位置傾向
- 短い形を反復する / 変化を増やす等のモチーフ運用
- Chord ToneとScale Toneをどの比率で使うか
- Chord外音がChord Toneへどう解決するか
- 解決が速い / 遅い、上行 / 下行のどちらが多いか

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

各区間Top 3候補。構成音3音未満ではconfidenceを下げる。4音Chordで欠けた構成音も軽くPenaltyする。

### Chord切替
新候補が旧候補を約10%以上上回った場合に切替。閾値は仮値。

## 3. Degree
選択中Keyを使用。Key未選択なら第1Key候補を仮使用し「Key候補: C major の場合」のように前提を明示。

Chord rootがKey scale外なら `♭VII` 等 + 「音階外」。悪いと評価しない。Chord qualityの正誤判定はDegreeでは行わない。

## 4. Melody
継続:
- 音域
- 最大跳躍 / 平均跳躍
- 同音連打
- リズム密度
- Chord Tone / Non-Chord Tone割合
- Scale Tone / Non-Scale Tone割合
- Chord ToneとScale Toneの組み合わせ
- Chord外・Scale内 / Chord内・Scale外 / 両方の外側
- Passing / Neighbor / Approach候補
- Natural / Harmonic / Melodic Minor比較
- Piano Roll上のChord × Scale可視化

v0.22追加:
- Resolution candidate + Evidence
- strong / weak musicalBeat context
- Suspension candidate
- Anticipation candidate
- Phrase Landing / Degree summary
- Piano Rollの追加Evidence

初期Trackは `roleHint === "melody"` を優先。なければ非Drum Trackの平均Pitchが最も高いTrackを仮選択し、ユーザーが変更できる。

同一Tickの複数Noteは代表Note 1つにまとめる。代表Noteは velocity → duration → pitch の順で優先する。

Chord Tone判定はユーザー選択Chordを優先し、未選択区間はChord第1候補を仮使用する。仮使用時はUIで明示する。

Scale Tone判定は選択Keyを優先し、未選択時はKey第1候補を仮使用する。majorはmajor scale、minorはNatural Minorを初期基準とする。Harmonic MinorとMelodic Minor上行形へ比較基準を切り替えられる。

## 5. Bass
- 最低音の動き
- Chord Rootとの一致
- 3rd / 5th / Other
- リズムの型

初期Trackは `roleHint === "bass"` を優先。なければ非Drum Trackの平均Pitchが最も低いTrackを仮選択し、ユーザーが変更できる。

同一Tickに複数Noteがある場合は最低Pitchを代表Bass Noteにする。

Root / 3rd / 5th / Otherは現在のChord候補との関係として表示する。7th等はChord ToneでもBass分類上はOtherに含める。

## 6. Rhythm
- 拍内発音位置
- シンコペーション候補
- Density
- 16分Grid表示

初期TrackはDrum Trackを優先。Drum TrackがなければNoteを持つ全Track。複数Track選択を許可する。

同一Tickの複数Noteは1 onsetとして数える。

シンコペーション候補は「musicalBeat拍頭以外のonset」の簡易候補。確定判定ではない。

16分Gridは `ppq / 4` を1 cellとして、小節内の発音位置分布を表示する。

6/8等のcompound meterでは3つのdenominator単位を1 musicalBeatとして扱う。

## 7. Chord Tone
Chord Tone / Non-Chord Toneは「その瞬間のChord構成音との関係」を示す特徴量。Non-Chord Toneを誤り扱いしない。

Chord UIが現在のeffective candidateをBasic Analyzerへ渡す。Chord対象Track変更またはChord候補選択時にMelody / BassのChord関係指標を再計算する。

## 8. Note Function: Chord Tone × Scale Tone × Time

### Scale Tone
現在のKey / Scale基準に含まれるPitch Classかを判定する。
minorでは Natural / Harmonic / Melodic Minor（上行形）を比較可能。

### Chord Tone
現在のChord effective candidateの構成音に含まれるPitch Classかを判定する。

### Chord × Scale 4分類
- **両方に含まれる**: Chord ToneかつScale Tone
- **Chord外・Scale内**
- **Chord内・Scale外**
- **両方の外側**

### v0.21 Temporal candidate
Chord外音に対して前後Noteを確認し、Passing / Neighbor / Approach / Other候補を付ける。時間間隔が2拍を超える場合や条件不足の場合は無理に分類しない。

## 9. v0.22 Resolution / Chord Change / Landing

### Resolution
現在NoteがChord外音で、次の代表Noteが2 musicalBeat以内に存在し、次NoteがChord ToneならResolution candidateとする。

Evidence:
- target pitch / tick
- delta tick / musicalBeat
- semitone interval
- up / down / same
- stepwise

次音がChord Toneでない場合はunresolved、Chord文脈不足・時間超過はunknown。

### Strong / Weak context
現在のTime SignatureからmusicalBeatを計算する。musicalBeat境界付近をstrong、それ以外をweakとする。compound meterではdenominator単位3つを1 musicalBeatとする。

このstrong / weakは簡易発音位置分類であり、アクセントの正解判定ではない。

### Suspension
Chord境界をまたいで保持された音について、旧Chord Tone → 新Chord Non-Chord Tone → 境界後2 musicalBeat以内の近接新Chord Toneという条件を満たした場合だけcandidateとする。

### Anticipation
Chord切替前1 musicalBeat以内に発音され、現在ChordではNon-Chord Tone、次ChordではChord Toneであり、境界まで保持または境界後に同Pitchが再発音される場合だけcandidateとする。

### Phrase Landing
長めの休符前、曲末、任意のSection境界前のNoteを着地候補とする。着地時点のChord Tone / Scale Tone / relation / chromatic Degree / gapをEvidenceとして表示する。

### UI / Piano Roll
初心者モードは `Metric → Meaning → Action`。詳細モードはEvidenceを表示。Piano RollはChord × Scale色分けを維持し、Passing / Neighbor / Approach / Resolution / Suspension / Anticipationを輪郭で補助表示する。read-onlyを維持する。

詳細: `docs/NOTE_FUNCTION_ANALYSIS.md`

## 10. 再計算
以下でNote Functionを再計算する。
- Key候補選択
- Chord候補選択
- Chord分析Track変更
- Melody Track変更
- Minor Scale基準変更
- MIDI再Import

## 11. 調整対象パラメータ
実MIDIで調整:
- Bass Bonus（仮1.5）
- Non-Chord Penalty（仮0.5）
- Key拮抗閾値（仮10%）
- Chord切替閾値（仮10%）
- Melody / Bass Track fallback heuristic
- Beat判定許容幅
- シンコペーション候補定義
- v0.21 Temporal candidate最大発音間隔（2拍）
- v0.22 Resolution最大間隔（2 musicalBeat）
- Suspension解決最大間隔（2 musicalBeat）
- Anticipation先取り最大間隔（1 musicalBeat）
- Phrase gap閾値（1 musicalBeat）

## 12. 非目標
- Note自動修正
- Melody / Chord自動生成
- Composition / Arrangement編集
- SongProject Schema変更
- IndexedDB Schema変更
- 外音・未解決音をミスとして採点

候補・Evidenceの不確実性を残し、分析から制作への最終判断はユーザー側に残す。
