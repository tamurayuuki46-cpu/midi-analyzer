# NOTE_FUNCTION_ANALYSIS.md

## Version
v0.22-dev

## 目的
Melody Noteを「良い / 悪い」で採点せず、**Chordとの関係**、**Key / Scaleとの関係**、**前後の動き**、**Chord changeをまたぐ緊張と解決**、**フレーズの着地**を分けて理解できるようにする。

Chord Tone / Non-Chord ToneとScale Tone / Non-Scale Toneは別概念として扱う。Passing / Neighbor / Approach / Resolution / Suspension / Anticipationは確定ラベルではなく、時間・拍・Chord・Durationから見た**候補**として扱う。

## 分析対象
- Melody分析で現在選択中のTrack
- Channel 10 Drumは除外
- 同一Tickに複数Noteがある場合は velocity → duration → pitch の順で代表Noteを1つ選ぶ
- Normalized Songを変更せず、Analysis Resultだけを生成する

## Key / Scale基準
- ユーザーがKey候補を選択済みならそのKeyを使用
- 未選択ならKey Analyzerの第1候補を仮使用
- major: Major Scale
- minor: Natural Minor / Harmonic Minor / Melodic Minor（上行基準）を比較可能
- minorの初期値はNatural Minor

Scale基準切替はNote Function Analysisの比較条件だけを変更する。Key候補、元MIDI、Normalized Song、SongProjectは変更しない。

## Chord基準
- ユーザーがChord候補を選択済みならそのChordを使用
- 未選択区間はChord Analyzerの第1候補を仮使用
- 仮使用した発音数をUIに明示

対応Template:
- major / minor / dim / aug
- sus2 / sus4
- 7 / maj7 / m7 / m7b5

## Chord × Scale 4分類
各NoteについてKeyとChordの両方を判定できる場合、次の4種類へ分類する。

1. **Chord Tone + Scale Tone**
2. **Chord外・Scale内**
3. **Chord内・Scale外**
4. **両方の外側**

この分類は正誤判定ではない。借用和音・Secondary Dominant・Modal Mixture・経過音・装飾音などでもScale外 / Chord外は起こり得る。

## v0.21 Temporal Candidate
### Passing
- 現在NoteがChord外音
- 前後がChord Tone
- 前→現在、現在→次が半音または全音のStep
- 2つの動きが同方向

### Neighbor
- 前後がChord Toneかつ同じPitch
- Stepで離れ、Stepで戻る

### Approach
- 次NoteがChord Tone
- 現在Noteから次Noteへ半音または全音で進む

前後の発音間隔がそれぞれ2拍を超える場合は無理に分類しない。Passing / Neighbor条件をApproachより優先する。

## v0.22 Resolution Candidate
Chord外音について、近い次の代表Melody Noteまで時間方向に追う。

候補条件:
- 現在NoteがChord外音
- 次Noteが存在する
- 次Noteまでが最大2 musicalBeat以内
- 次NoteのChord Tone判定が可能

次NoteがChord ToneならResolution候補とし、次のEvidenceを保持する。
- target pitch / tick
- delta tick
- delta musicalBeat
- interval semitone
- up / down / same
- stepwiseかどうか

次音がChord Toneでない場合は未解決候補、Chord文脈不足や時間間隔超過はunknownとして保留する。Resolution率は品質Scoreではない。

## Strong / Weak Beat Context
Time SignatureからmusicalBeatを計算する。

- 単純拍子: denominator単位をmusicalBeatとして扱う
- 6/8等のcompound meter: denominator単位3つを1 musicalBeatとして扱う
- musicalBeat境界付近をstrong、それ以外をweakとする

これは発音位置の文脈であり、音楽理論上の全アクセント階層を断定するものではない。4/4と6/8をFixtureで検証する。

## Suspension Candidate
保守的に次をすべて満たした場合のみ候補化する。

- NoteがChord境界をまたいで保持される
- 旧ChordではChord Tone
- 新ChordではNon-Chord Tone
- 旧Chordと新Chordが異なる
- 境界後2 musicalBeat以内に次の代表Noteがある
- 次Noteが新ChordのChord Tone
- 保持音→次Noteが半音または全音のStep

Evidence:
- chord boundary tick
- from / to chord
- target pitch / tick
- boundaryから解決までのtick / musicalBeat
- interval / direction

条件不足ならSuspensionと断定しない。

## Anticipation Candidate
次ChordのChord ToneをChord切替前に先取りする動きを候補化する。

- 現在ChordではNon-Chord Tone
- 次ChordではChord Tone
- Chord境界まで1 musicalBeat以内
- Noteが境界まで保持される、または境界後1 musicalBeat以内に同Pitchが再発音される

Evidence:
- boundary tick
- next chord
- lead tick / musicalBeat
- boundaryをまたいで保持したか
- boundary後に同Pitch再発音があるか

## Phrase Landing
長めの休符・曲末・将来のSection境界入力を使い、フレーズの着地点候補を抽出する。

初期条件:
- 次Noteまで1 musicalBeat以上の休符があるNote
- 曲末のNote
- `sectionBoundaries`が与えられた場合、その境界直前のNote

着地時点で次を表示する。
- pitch / tick
- Chord Tone / Non-Chord Tone
- Scale Tone / Non-Scale Tone
- Chord × Scale relation
- Key rootから見たchromatic Degree
- gap tick / musicalBeat

Degreeは観測用であり、旋律の良し悪しを判定しない。

## Piano Roll表示
OverviewのPiano Rollで、Melody Note Function Analysisと同じTrackを表示している場合のみ役割を可視化する。

色分け:
- Chord Tone + Scale Tone
- Chord外・Scale内
- Chord内・Scale外
- Chord外・Scale外

輪郭候補:
- Passing / Neighbor / Approach
- Resolution
- Suspension
- Anticipation

Piano Rollはread-only。色分け・輪郭によって元Note、Velocity、Duration、Track、Chord候補を変更しない。

## UI
### 初心者モード
「音の役割」で次を短く表示する。
- Scale Tone率 / Chord Tone率
- Resolution候補
- Suspension候補
- Anticipation候補
- Phrase Landing数
- Meaning
- 任意Action

Actionは元案を残したまま比較できる実験案であり、採用を強制しない。

### 詳細モード / Melody
専用Panelで以下を表示する。
- Chord × Scale 4分類
- Passing / Neighbor / Approach
- Resolution率とEvidence
- Chord外音のstrong / weak文脈
- Suspension / Anticipation
- Phrase Landing / Degree summary
- Minor Scale比較基準
- Chord候補を仮使用している場合の注意

## 再計算
次の場合にNote Functionを再計算する。
- Melody Track変更
- Key候補選択
- Chord候補選択
- Chord分析対象Track変更
- Minor Scale比較基準変更
- 新しいMIDIの読み込み

再計算結果はPiano Rollへイベントで通知する。

## データ安全性
- Normalized Songを変更しない
- 元MIDIを変更しない
- SongProject v1 Schemaを変更しない
- IndexedDB Schemaを変更しない
- Note Functionはread-only Analysis Layer
- 候補を自動確定しない
- 外音をミス扱いしない

## テスト
v0.22ではv0.21回帰に加え次を固定する。
- Resolution positive / negative
- 4/4 strong / weak
- 6/8 compound musicalBeat
- Suspension positive / negative
- Anticipation positive
- Phrase Landing / Degree

## 次候補
- Retardationの独立候補
- Appoggiatura / Escape Tone
- Phrase contour / climax / peak note
- Section間Landing比較
- Reference Insightへ「解決速度 / 方向」を抽象化して追加

これらもCandidate / Evidenceを原則とし、Composition自動生成には踏み込まない。
