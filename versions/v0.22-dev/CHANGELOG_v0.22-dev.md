# v0.22-dev

更新日: 2026-10-15
状態: Resolution / Landing Analysis（Note Function II）

## 追加
- Chord外音から次のChord ToneへのResolution候補
- 解決までのtick / musicalBeat / 半音距離 / 上下方向Evidence
- musicalBeat基準の強拍 / 弱拍文脈（4/4・6/8対応）
- Suspension候補（Chord changeをまたぐ保持音→近接Chord Tone解決）
- Anticipation候補（次Chord Toneの先取り）
- 長めの休符前・曲末のPhrase Landing候補とDegree要約
- 初心者向けMetric → Meaning → ActionへのResolution情報
- Piano RollのResolution / Suspension / Anticipation補助表示
- positive / negative / 4/4 / 6/8回帰テスト

## 変更
- Note Function詳細Panelをv0.22へ更新。
- package versionを0.22.0-devへ更新。

## 安全性
- Normalized Song変更なし
- SongProject v1変更なし
- IndexedDB v3変更なし
- 保存済みMIDI / Clip / Stem変更なし
- 自動Note修正なし
- main直接変更なし
- stable tag未作成

## 復元ポイント
- `restore/develop-before-resolution-landing-v0.22-20261015`

## 未対応
- Appoggiatura / Escape Tone / Retardationの詳細分類
- Phrase contour / climax / peak note
- Section間Landing比較
- Android実機最終確認
- Cubasis / Cubase実機回帰
