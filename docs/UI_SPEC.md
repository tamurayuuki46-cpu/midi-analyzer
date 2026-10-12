# UI_SPEC.md

## 対象
Android Chrome / スマートフォン。

## 画面フロー

Import
↓
保存選択（初期OFF）
↓
Track一覧
↓
Key / Scale候補
↓
Piano Roll
↓
分析
  ├─ コード
  ├─ メロディ
  ├─ ベース
  └─ リズム

## v0.1主要操作
- Import
- 保存する / しない
- 保存済みMIDI一覧 / 削除
- Key / Scale候補選択
- Track選択
- 分析対象Track選択
- Piano Roll表示
- Play / Stop

## Key / Scale UI
- Import直後に上位3候補を表示
- 各候補に「一致度 xx%」を表示
- 一致度は確率ではないと明記
- 初期状態ではKeyを自動確定しない
- 「この候補を選ぶ」をタップしたときだけ選択状態になる
- 候補が拮抗する場合は補助ヒントを小さく表示
- 補助ヒントが順位を変更していないことを明記

## 保存UI
- 「この端末に保存する」はcheckbox、初期値OFF
- ONの場合だけ元MIDIと正規化結果をIndexedDBへ保存
- 保存先が端末内のみであることを明記
- 保存失敗はImport失敗と混同しない
- 保存済み一覧は新しい順、削除前に確認する

## Piano Roll UI
- Import直後に読み取り専用Piano Rollを表示
- 表示Trackはselectで切り替える
- 初期TrackはNoteを持つ非Drum Trackを優先
- 1度に1 Trackだけ描画する
- 横ズームは `− / ＋` ボタン。ピンチ操作を必須にしない
- 横スクロールで時間方向、縦スクロールでPitch方向を見る
- Note移動、長さ変更、Quantizeは行わない

## v0.1では置かない
- 一般Export
- Demo Composerへ送る
- Loop
- Tempo変更
- MIDI編集
- 音色選択

## Android原則
- 片手操作
- タップ領域を広く
- 小さすぎる文字を避ける
- 長押し依存を避ける
- ピンチ必須にしない
- 横スクロールはPiano Roll中心
- 分析結果は縦スクロール中心
