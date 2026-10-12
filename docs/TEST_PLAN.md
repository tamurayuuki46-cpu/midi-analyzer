# TEST_PLAN.md

## Parser / Normalizer unit test

実装済み:
1. Note / Track / Tempo / Time Signature正規化
2. MIDI Channel 10 Drum判定
3. 1 Track内の複数Channel保持
4. Tempo / 拍子がない場合のStandard既定値
5. 不完全Note On / Off Warning
6. SMPTE time division拒否
7. 不正origin拒否

実行:

```bash
npm test
```

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

## 次のParser integration test

raw parsed objectだけでなく、固定 `.mid` binary fixtureを `midi-file` で実際にparseし、以下を確認する。
- deltaTime → absolute tick
- trackName
- tempo change
- time signature change
- noteOn velocity 0
- Format 0 / 1

## Regression
Analysis Engine変更前後で固定MIDIを再解析し、意図しない結果変化がないか確認する。

アルゴリズムによる結果変更はCHANGELOGへ記録。
