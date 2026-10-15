# CHANGELOG v0.21-dev

Version: v0.21-dev
更新日: 2026-10-15

## 【追加】
- MelodyのChord外音へPassing Tone候補を追加。
- Neighbor Tone候補を追加。
- Approach Note候補を追加。
- minor KeyのScale Tone比較基準としてNatural Minor / Harmonic Minor / Melodic Minor（上行基準）を切替可能化。
- OverviewのPiano RollへChord Tone × Scale Toneの役割色分けを追加。
- Piano RollへPassing / Neighbor / Approach候補の輪郭表示を追加。
- Note Function Analyzerの時間方向Unit Testを追加。
- 360 / 390 / 430px Chromium回帰へTemporal Note FunctionとPiano Roll役割表示の検証を追加。

## 【変更】
- Note Function Panelを「Chord Tone / Scale Tone / 経過候補」へ拡張。
- 初心者モードの「音の役割」MetricへPassing / Neighbor / Approach候補数を追加。
- Scale Tone判定はminor時に比較基準を選べるよう変更。初期値はNatural Minor。
- Note Function再計算結果をPiano Rollへ通知し、Melody分析Trackと表示Trackが一致する場合に可視化する。

## 【修正】
- 前後の時間間隔が大きいNoteをPassing / Neighbor / Approachへ無理に分類しないよう制限。
- Passing / Neighbor条件を満たす場合は単純なApproach候補より優先するよう整理。

## 【互換性】
- 元MIDIを変更しない。
- Normalized Song Schemaを変更しない。
- SongProject v1 Schemaを変更しない。
- IndexedDB `midi-analyzer` version 3を変更しない。
- 保存済みMIDI / Clip / Stem / Take / Memoを変換・削除しない。
- Chord / Key候補順位をNote Function側から変更しない。

## 【復元ポイント】
- 変更前: `restore/develop-before-note-resolution-v0.21-20261015`
- Feature Branch: `chatgpt/note-resolution-v0.21`
- 完成後Milestone: CI合格・develop統合後に作成。

## 【未対応】
- Suspension / Retardation / Anticipation / Appoggiaturaの分類。
- 拍位置・Accent・Durationを含む高度なNon-Chord Tone機能判定。
- Melodic Minor下降形の自動文脈判断。
- Android実機での色・タッチ・PWA再起動回帰。
- stable tag作成（Android実機および必要なCubasis/Cubase実機確認後のみ）。
