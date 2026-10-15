# v0.22-dev

更新日: 2026-10-15
状態: Resolution / Landing Analysis（Note Function II）develop統合済み

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
- 360 / 390 / 430px Mobile Chromium回帰をv0.22表示へ更新

## 変更
- Note Function詳細Panelをv0.22へ更新
- アプリ画面内Versionをv0.22-devへ更新
- package versionを0.22.0-devへ更新
- README / ANALYSIS_SPEC / NOTE_FUNCTION_ANALYSIS / AI_HANDOFFをv0.22へ同期

## 修正
- Suspension候補がChord境界前の中間Noteで探索停止するケースを修正
- Piano RollでResolution-only候補の輪郭が透明になる表示を修正
- 旧v0.21固定のMobile regression期待値をv0.22へ同期

## 自動検証
PR #55および統合後developで次を確認。
- Unit tests: success
- Production build: success
- Basic Pitch local model assets: success
- Mobile Chromium regression: success
- Mobile widths: 360 / 390 / 430px

## 安全性
- Normalized Song変更なし
- SongProject v1変更なし
- IndexedDB v3変更なし
- 保存済みMIDI / Clip / Stem変更なし
- 自動Note修正なし
- main直接変更なし
- stable tag未作成

## Git
- 実装PR: `#55`（develop統合済み）
- 統合commit: `6224947576ec3e925adb7c8881b0bbe02c41b3a7`
- 変更前復元ポイント: `restore/develop-before-resolution-landing-v0.22-20261015`
- feature-complete milestone: `chatgpt/v0.22-feature-complete-milestone`

## 未対応
- Appoggiatura / Escape Tone / Retardationの詳細分類
- Phrase contour / climax / peak note
- Section間Landing比較
- Android実機最終確認
- Cubasis / Cubase実機回帰

`main` / 公開Versionはv0.18-devのまま。stable tagは実機確認後のみ作成する。
