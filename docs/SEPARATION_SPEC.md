# SEPARATION_SPEC.md

## Version
v0.2以降。

## A. MIDI内パート分離
スマホJavaScript上で、
Melody / Bass / Chord / Drums等への役割候補を推定する。

結果は確定ではなくCandidate / Confidence。

## B. 音声→音符
RipX等の担当。
MIDI AnalyzerのスマホPWAでは実装しない。

## v0.1で準備するinterface

```text
separate(notes, context)
  -> {
       assignments: [
         { noteIds, role, confidence }
       ],
       alternatives: []
     }
```

元Noteを書き換えない。
分離結果は別Layerに保持する。
