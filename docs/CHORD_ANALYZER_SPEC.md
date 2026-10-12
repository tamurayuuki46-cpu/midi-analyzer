# CHORD_ANALYZER_SPEC.md

## Version
v0.2.1-dev

## 目的
Normalized Song / NoteからChord候補を作り、Degreeと一緒に表示する。

Chordを自動確定しない。各区間で候補3つを提示し、ユーザーが必要な区間だけ選択する。

加えて、各区間のランキング1位を時間順に並べた「候補1位のコード進行」を、すぐ全体像を確認するための仮進行として表示する。

## 入力
- Normalized Song
- ユーザーが選択したChord分析対象Track IDs
- Degree表示用のKey / Scale候補またはユーザー選択Key

Parser raw eventへ直接依存しない。

## Track選択
- Channel 10 Drum Track / Drum Noteは分析対象外
- `roleHint === "chord"` のTrackがあれば初期ON
- Chord hintがない場合はNoteを持つ非Drum Trackを初期ON
- ユーザーはTrackごとにON / OFFできる
- Track選択を変えたらChord候補を再計算し、以前のChord選択は解除する
- 再計算後、Top 1コード進行も新しい`candidates[0]`から作り直す

## 時間Grid
内部分析Grid:
`ppq × 4 / denominator`

例:
- 4/4 → 4分音符
- 3/4 → 4分音符
- 6/8 → 8分音符

6/8等では内部Gridと音楽的Beatを分離する。
- analysisGrid: 8分音符
- musicalBeat: 付点4分音符

画面では同じChord候補が続くGridを同一小節内でまとめる。
小節をまたいで1つの表示区間にはしない。

## Pitch Class重み
各分析Window内でNoteの重なり時間を使用する。

`overlapDurationTick × velocity`

## Chord Template
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

12 root × 10 templateを評価する。

## Score
暫定値:
- Bass Bonus: 1.5
- Non-Chord Penalty: 0.5
- Chord切替閾値: 10%

最低音のPitch Classがcandidate rootと一致した場合にBass Bonusを加える。
Chord外音にはPenaltyを加える。
構成音が3音未満の場合はconfidenceを下げる。
4音Chordで構成音が欠けている場合も不足分を軽くPenaltyする。

これらは実MIDIで調整する仮値。

## Candidate
各表示区間で上位3候補。

```json
{
  "id": "chord-1-0",
  "startTick": 0,
  "endTick": 480,
  "barNumber": 1,
  "candidates": [
    {
      "value": "Cmaj7",
      "root": 0,
      "quality": "maj7",
      "confidence": 0.84
    }
  ],
  "selected": null
}
```

confidenceは確率ではなく一致度。
selectedはAnalyzerが自動設定しない。

## 候補1位のコード進行
`buildTopChordProgression(segments)` は、Chord segmentを時間順のまま走査し、各segmentの `candidates[0]` だけを取り出す。

表示例:

`C → G → Am → F`

各stepには以下を表示する。
- 小節番号
- Chord名
- 一致度

この進行は「自動ランキング1位の一覧」であり、確定Chordではない。
ユーザーが下のTop 3から候補2位・3位を手動選択しても、このTop 1進行は変更しない。

目的:
- MIDIを読み込んだ直後に曲全体のChord流れを素早く見る
- Top 3カードを1区間ずつ読まなくても大まかな進行を把握する
- 将来のCopy / Export / Demo Composer連携の入力候補にする

## Chord切替
隣接Gridで候補が変わっても、新候補が直前Chord候補を約10%以上上回らない場合は直前候補を維持する。

目的は、わずかなNote差でChord表示が細かく点滅するのを防ぐこと。

## Degree
DegreeはChord rootをKey / Scaleに対して表示する。
Chord qualityの正誤判定はしない。

Keyをユーザーが選択済み:
`Degree基準: 選択Key C major`

未選択:
`Degree基準: Key候補 C major の場合`

Major例:
- C in C major → I
- G in C major → V
- B♭ in C major → ♭VII / 音階外

Minor例:
- C in A minor → III
- G in A minor → VII
- G♯ in A minor → ♯VII / 音階外

音階外Chordを悪いとは評価しない。

## v0.2.1時点でしない
- Chord名の手動編集
- Secondary Dominant等の機能和声ラベル
- Top 1コード進行のCopy / Export / Demo Composer送信
- Top 1コード進行へのユーザー手動選択の混在
- Chord Tone coloring

Slash Chord / 転回形候補はv0.2 Chord Detail上位Layerで表示する。v0.1由来のChord Candidate選択値自体は変更しない。
