# TEST_PLAN.md

## Parser / Analyzer用MIDI

最低限:
1. C–G–Am–F（各1小節）
2. 1小節2コード
3. 転回形 C/E
4. 音数が少ない伴奏
5. RipX想定の非Quantize MIDI
6. Scaler / EZkeys想定のQuantize MIDI
7. 3/4
8. 6/8
9. ループ曲
10. イントロだけ別調

## Regression
Analysis Engine変更前後で固定MIDIを再解析し、
意図しない結果変化がないか確認する。

アルゴリズムによる結果変更はCHANGELOGへ記録。
