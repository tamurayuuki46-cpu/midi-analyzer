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

## Parser integration regression test

固定binary MIDI fixtureを実際に `midi-file` へ通し、Parser → Normalizer境界を確認する。

実装済み:
- Format 1 / 2 Track fixture
- Format 0 / Drum fixture
- deltaTime → absolute tick
- trackName
- tempo change
- time signature
- Note On velocity 0 → Note Off
- Channel 10 Drum
- origin保持
- implicit 120 BPM

FixtureはGitHubで差分確認しやすいよう、固定hexを `Uint8Array` へ復元して利用する。
実MIDI Parserを通すため、raw parsed objectだけのUnit Testを補完するRegression Testとして扱う。

## Storage unit test

実装済み:
- IndexedDB保存
- 一覧取得
- 削除
- 保存record構造

## Piano Roll model unit test

実装済み:
1. Track Note抽出 / sort
2. 初期Track選択（非Drum優先）
3. Pitch Range padding / minimum span
4. MIDI Pitch境界 0〜127
5. 4/4 bar / beat marker
6. MIDI Note名表示
7. 拍子変更時のbar再開

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

## Manual UI test

Android Chromeで確認:
- Track selectorが44px以上の操作領域で使える
- − / ＋ Zoomが片手で押せる
- 横 / 縦スクロールが競合しない
- 長いMIDIでページ全体が破綻しない
- Drum Trackも表示できる
- Import / IndexedDB保存 / 削除がPiano Roll追加後も動く

## Regression
Analysis Engine変更前後で固定MIDIを再解析し、意図しない結果変化がないか確認する。

アルゴリズムによる結果変更はCHANGELOGへ記録。
