# NOTE_FUNCTION_ANALYSIS.md

## Version
v0.20-dev

## 目的
Melody Noteを「良い / 悪い」で採点せず、**Chordとの関係**と**Key / Scaleとの関係**を分けて理解できるようにする。

Chord Tone / Non-Chord ToneとScale Tone / Non-Scale Toneは別概念として扱う。

## 分析対象
- Melody分析で現在選択中のTrack
- Channel 10 Drumは除外
- 同一Tickに複数Noteがある場合は、既存Melody Analyzerと同じく velocity → duration → pitch の順で代表Noteを1つ選ぶ

## Key / Scale基準
- ユーザーがKey候補を選択済みならそのKeyを使用
- 未選択ならKey Analyzerの第1候補を仮使用
- major: major scale
- minor: natural minorを基本基準

minorのraised 6th / 7thなど、harmonic / melodic minor由来の音を誤り扱いしない。v0.20では基本音階から外れたという観測値だけを表示する。

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

## 4分類
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

### 両方の外側
Chromatic approach等の可能性があるが、v0.20では前後関係だけでPassing / Neighbor / Approachを断定しない。

## UI
### 初心者モード
既存Metric群へ「音の役割」を追加し、次を短く表示する。
- Scale Tone率
- Chord Tone率
- 両者が異なるNoteの有無
- Meaning
- 任意Action

### 詳細モード / Melody
専用Panelで以下を表示する。
- Scale Tone率
- Chord Tone率
- Chord外・Scale内数
- Chord内・Scale外数
- 両方の外側数
- Chord候補を仮使用している場合の注意
- Chord ToneとScale Toneの定義

## 再計算
次の場合にNote Functionを再計算する。
- Melody Track変更
- Key候補選択
- Chord候補選択
- Chord分析対象Track変更
- 新しいMIDIの読み込み

## データ安全性
- Normalized Songを変更しない
- 元MIDIを変更しない
- SongProject v1 Schemaを変更しない
- IndexedDB Schemaを変更しない
- Note Functionはread-only Analysis Layer

## 今後
v0.20では機能名を断定しない。

将来候補:
- Passing Tone
- Neighbor Tone
- Approach Note
- Suspension / Retardation
- Anticipation

これらは前後Note、Chord change、拍位置、解決方向まで評価してから追加する。
