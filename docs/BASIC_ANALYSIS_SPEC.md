# BASIC_ANALYSIS_SPEC.md

## Version
v0.1-dev

## 目的
Melody / Bass / Rhythmを「良い・悪い」で採点せず、MIDIから観察できる特徴量として表示する。

分析対象はNormalized Songのみ。元MIDI event modelへ直接依存しない。

## Track選択
### Melody
1. `roleHint === "melody"` を優先
2. 該当がなければ、非Drum Trackのうち平均Pitchが最も高いTrackを初期候補にする
3. ユーザーが画面で変更できる

### Bass
1. `roleHint === "bass"` を優先
2. 該当がなければ、非Drum Trackのうち平均Pitchが最も低いTrackを初期候補にする
3. ユーザーが画面で変更できる

### Rhythm
1. Drum TrackがあればDrum Trackを初期選択
2. Drum TrackがなければNoteを持つ全Trackを初期選択
3. 複数Trackをチェック式で変更できる

## Melody
v0.1で表示:
- 音域（最低 / 最高Pitch、半音数）
- 最大跳躍 / 平均跳躍
- 同音連打数 / 比率
- 発音密度（4分音符あたり）
- Chord Tone / Non-Chord Tone数・比率

同一Tickに複数Noteがある場合、Melodyの動き計算では代表Note 1つへまとめる。
代表Noteは velocity → duration → pitch の順で優先する。

Chord Tone判定は、該当区間でユーザーがChordを選択済みならそのChordを使用する。
未選択ならChord第1候補を仮使用し、UIでその前提を明示する。

Non-Chord Toneは誤り扱いしない。

## Bass
v0.1で表示:
- 各発音位置の最低音の移動
- 平均 / 最大移動量
- 上行 / 下行 / 同音の回数
- Chord Root / 3rd / 5th / Other
- Root一致率
- 拍頭中心 / 拍裏・細分中心 / 混合 の簡易リズム型

同一Tickに複数Noteがある場合は最低PitchをBass代表Noteにする。

Chordとの関係はMelodyと同様に、選択Chord優先、未選択時は第1候補を仮使用する。
7th等はChord ToneであってもBass分類上はOtherに含める。

## Rhythm
v0.1で表示:
- 発音位置
- 拍頭 / 拍頭以外
- シンコペーション候補
- 発音密度
- Note密度
- 16分Gridの発音分布

Rhythmでは同一Tickの複数Noteを1 onsetとして数える。

シンコペーション候補はv0.1では「musicalBeatの拍頭以外で始まるonset」の簡易候補。
確定判定ではない。

### 拍の扱い
通常拍子:
- denominator基準のbeat

6/8等のcompound meter:
- `numerator >= 6 && numerator % 3 === 0` の場合、3つのdenominator単位を1 musicalBeatとして扱う
- 例: 6/8 → musicalBeatは付点4分音符

16分Gridは `ppq / 4` を1 cellとし、小節内のonset数を表示する。

## Chord連動
Chord UIはBasic Analyzerへ以下を渡す:
- 現在のChord segments
- 各segmentのユーザー選択Chord
- 未選択時の第1候補
- selection source（selected / candidate）

Chord分析対象Trackが変更された場合、Melody / BassのChord関係指標も再計算する。
Chord候補をユーザーが選択した場合も再計算する。

## 表示方針
- confidenceや比率は確率として断定しない
- 候補 / 特徴量として表示する
- Non-Chord Toneや拍裏を悪いと評価しない
- Androidスマートフォンで1列〜3列へ自然に折り返す

## v0.1既知の限界
- Melodyの同時発音代表Noteは簡易heuristic
- Melody / Bass初期Track推定はroleHint + 平均Pitch heuristic
- シンコペーションは拍頭以外onsetの簡易候補
- HumanizeされたMIDIのbeat判定許容幅は暫定
- 実MIDIで閾値 / 表示の読みやすさを調整する必要がある
- Motif分析はv0.2以降
