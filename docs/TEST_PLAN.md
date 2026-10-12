# TEST_PLAN.md

## Parser / Normalizer unit test
実装済み: Normalizer 7件。

## Parser integration regression test
実装済み: 固定Format 0 / Format 1 fixture 2件。
- deltaTime → absolute tick
- trackName / tempo change / time signature
- Note On velocity 0
- Channel 10 Drum / origin

## Storage unit test
実装済み: IndexedDB 4件。

## Piano Roll model unit test
実装済み: 7件。

## Key / Scale Analyzer unit test
実装済み:
1. durationTick × velocity重み
2. Channel 10 Drum除外
3. C major基本候補
4. A minor基本候補
5. confidence 0〜1
6. Drums-only時の候補なし
7. 拮抗時hintが順位変更を主張しないこと

実行:

```bash
npm test
```

## Parser / Analyzer用実MIDI
今後のManual / Regression用:
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

## Key Analyzer追加確認
- C major / A minorの相対調が拮抗する例
- 長く保持する音が結果へ反映されること
- velocity差が結果へ反映されること
- Drum Trackを含めても候補が変わらないこと
- Chromatic Noteが少量混じるMIDI
- Introだけ別調のMIDI（全曲Key推定の限界確認）

## Manual UI test
Android Chromeで確認:
- Key候補ボタンが片手で押せる
- 候補選択で見た目が変わる
- Piano Roll / Import / Storageと競合しない
- 長いMIDIでページ全体が破綻しない

## Regression
Analysis Engine変更前後で固定MIDIを再解析し、意図しない結果変化がないか確認する。
アルゴリズムによる結果変更はCHANGELOGへ記録。
