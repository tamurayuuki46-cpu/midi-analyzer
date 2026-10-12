# UI_SPEC.md

## 対象
Android Chrome / スマートフォン。

## 画面フロー
Import → 保存選択（初期OFF） → Track一覧 → Key / Scale → Chord / Degree → Piano Roll → Melody / Bass / Rhythm分析

## v0.1主要操作
- Import
- 保存する / しない
- 保存済みMIDI一覧 / 削除
- Piano Roll Track選択 / Zoom
- Key Candidate選択
- Chord分析対象Track ON / OFF
- Chord Candidate選択
- Play / Stop

## Key UI
- Top 3候補
- confidenceは一致度
- 自動確定しない
- Candidateをタップしたときだけ選択状態

## Chord / Degree UI
- Noteを持つ非Drum Trackをcheckboxで分析対象にする
- `roleHint=chord`がある場合は初期ON
- 候補は小節内のChord区間ごとにTop 3
- Candidateボタンは44px以上のタップ領域
- Chord名 / Degree / 一致度を同時表示
- Key未選択時は「Key候補 X の場合」と明記
- Key選択変更時はDegree表示だけを更新できる
- 音階外Degreeには「音階外」を表示するが警告色で誤り扱いしない
- Track選択変更時はChord解析をやり直し、以前のChord選択を解除する

## Piano Roll UI
- 読み取り専用
- 1 Track表示
- `− / ＋` Zoom、横時間Scroll / 縦Pitch Scroll
- Note移動 / 長さ変更 / Quantizeなし

## v0.1では置かない
- 一般Export / Demo Composerへ送る
- Loop / Tempo変更
- MIDI編集 / 音色選択
- Chord名手動編集

## Android原則
- 片手操作
- タップ領域を広く
- 小さすぎる文字を避ける
- 長押し / ピンチ必須にしない
- 横スクロールはPiano Roll中心
- 分析結果は縦スクロール中心
