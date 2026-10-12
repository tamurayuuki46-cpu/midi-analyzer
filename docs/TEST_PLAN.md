# TEST_PLAN.md

## 実装済み自動テスト

### Parser / Normalizer
- 正規化 / Drum / 複数Channel / 既定Tempo拍子 / Warning / SMPTE拒否 / origin
- 固定binary-like MIDI fixture Format 0 / Format 1を実Parser経由で検証

### Storage
- IndexedDB保存 / 一覧 / 削除 / record構造

### Piano Roll
- Track抽出 / 初期Track / Pitch Range / MIDI境界 / bar-beat marker / Note名 / 拍子変更

### Key Analyzer
- major / minor基本判定
- Drum除外
- duration × velocity
- confidence / 候補なし

### Chord Analyzer
1. C major triad → C
2. A minor triad → Am
3. C/E転回形 → C
4. G7構成音あり → G7
5. Track選択 / Channel 10除外
6. 2音だけの候補はconfidenceを下げる
7. 6/8: analysisGrid=8分 / musicalBeat=付点4分
8. C major Degree: C=I / B♭=♭VII音階外
9. A minor Degree: C=III / G♯=♯VII音階外
10. 同一小節で同じChordが続くGridを1区間にまとめる

実行:
```bash
npm test
npm run build
```

## 実MIDIテスト候補
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

## Android Manual
- Chord Track checkboxが片手で押せる
- Chord候補3つが縦スクロールで読みやすい
- Key選択を変えるとDegreeが即時更新される
- Chord候補選択が区間ごとに保持される
- 長いMIDIでChord区間数が多くてもページが破綻しない
- Import / Storage / Piano Roll / Key機能が回帰していない

## Regression
Analysis Engine変更前後で固定MIDIを再解析し、意図しない結果変化がないか確認する。
アルゴリズム結果変更はCHANGELOGへ記録する。
