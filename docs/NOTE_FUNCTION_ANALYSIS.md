# NOTE_FUNCTION_ANALYSIS.md

## Version
v0.21-dev

## 目的
Melody Noteを「良い / 悪い」で採点せず、**Chordとの関係**、**Key / Scaleとの関係**、**前後の動き**を分けて理解できるようにする。

Chord Tone / Non-Chord ToneとScale Tone / Non-Scale Toneは別概念として扱う。Passing / Neighbor / Approachは確定ラベルではなく、前後2音とChord Toneへの解決から見た**候補**として扱う。

## 分析対象
- Melody分析で現在選択中のTrack
- Channel 10 Drumは除外
- 同一Tickに複数Noteがある場合は、既存Melody Analyzerと同じく velocity → duration → pitch の順で代表Noteを1つ選ぶ

## Key / Scale基準
- ユーザーがKey候補を選択済みならそのKeyを使用
- 未選択ならKey Analyzerの第1候補を仮使用
- major: major scale
- minor: Natural Minor / Harmonic Minor / Melodic Minor（上行基準）を比較可能
- minorの初期値はNatural Minor

Scale基準切替はNote Function Analysisの比較条件だけを変更する。Key候補、元MIDI、Normalized Song、SongProjectは変更しない。

Melodic Minorはv0.21では上行形 `[1, 2, ♭3, 4, 5, 6, 7]` を比較基準とする。下降形の文脈判定は行わない。

## Chord基準
- ユーザーがChord候補を選択済みならそのChordを使用
- 未選択区間はChord Analyzerの第1候補を仮使用
- 仮使用した発音数をUIに明示

対応Template:
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

## Chord × Scale 4分類
各NoteについてKeyとChordの両方を判定できる場合、次の4種類へ分類する。

1. **Chord Tone + Scale Tone**
2. **Chord外・Scale内**
3. **Chord内・Scale外**
4. **両方の外側**

この分類は正誤判定ではない。

### Chord外・Scale内
例: C major Key / C major Chord上のD。

Chord構成音ではないがC major Scaleには含まれる。

### Chord内・Scale外
例: C major Key / C7上のB♭。

C7のChord Toneだが、C major Scaleの基本7音には含まれない。

借用和音、Secondary Dominant、Modal Mixture等でも同様の状態が起こり得るため、異常・誤りとは扱わない。

## Passing / Neighbor / Approach候補
v0.21ではChord外音に対し、前後の代表Melody Noteを使って保守的に候補を付ける。

### 共通条件
- 現在NoteがChord外音である
- 前後Noteが時間順に存在する
- 前→現在、現在→次の発音間隔がそれぞれ2拍以内
- Stepは半音または全音として扱う

### Passing候補
- 前後がChord Tone
- 前→現在、現在→次がどちらもStep
- 2つの動きが同方向

例: C major Chord上の `C - D - E` のD。

### Neighbor候補
- 前後がChord Tone
- 前後が同じPitch
- 現在NoteへStepで離れ、逆方向のStepで元のPitchへ戻る

例: C major Chord上の `C - D - C` のD。

### Approach候補
- 次NoteがChord Tone
- 現在Noteから次Noteへ半音または全音で進む
- Passing / Neighbor条件を満たす場合はそちらを優先

### その他Chord外音
条件不足、広い跳躍、時間間隔が大きい場合は無理に分類せず `other-non-chord` とする。

## Piano Roll表示
OverviewのPiano Rollで、Melody Note Function Analysisと同じTrackを表示している場合のみ役割を可視化する。

色分け:
- Chord Tone + Scale Tone
- Chord外・Scale内
- Chord内・Scale外
- Chord外・Scale外

輪郭:
- Passing候補
- Neighbor候補
- Approach候補

Piano Rollはread-only。色分けによって元Note、Velocity、Duration、Track、Chord候補を変更しない。

## UI
### 初心者モード
既存Metric群の「音の役割」で次を短く表示する。
- Scale Tone率
- Chord Tone率
- Passing候補数
- Neighbor候補数
- Approach候補数
- Meaning
- 任意Action

### 詳細モード / Melody
専用Panelで以下を表示する。
- Scale Tone率
- Chord Tone率
- Chord外・Scale内数
- Chord内・Scale外数
- 両方の外側数
- Passing / Neighbor / Approach候補数
- その他Chord外音数
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

再計算結果はPiano Rollへイベントで通知し、現在表示中のMelody Trackが一致する場合に可視化を更新する。

## データ安全性
- Normalized Songを変更しない
- 元MIDIを変更しない
- SongProject v1 Schemaを変更しない
- IndexedDB Schemaを変更しない
- Note Functionはread-only Analysis Layer

## 未対応
- Suspension / Retardation
- Anticipation
- Appoggiatura等の拍・アクセントを含む分類
- Melodic Minor下降形の自動文脈判断
- Chord change直前直後をまたぐ高度な解決判定

これらは前後NoteだけでなくChord change、拍位置、Duration、アクセントまで評価してから追加する。
