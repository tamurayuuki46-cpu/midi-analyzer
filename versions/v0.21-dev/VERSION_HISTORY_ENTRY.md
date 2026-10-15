# VERSION HISTORY ENTRY — v0.21-dev

更新日: 2026-10-15

状態: Temporal Note Function / Minor Scale Basis / Piano Roll Role Visualization 実装。

主な内容:
- Passing Tone候補
- Neighbor Tone候補
- Approach Note候補
- Natural / Harmonic / Melodic Minor比較
- Piano Roll Chord × Scale色分け
- Temporal candidate輪郭表示
- Unit Test / 360・390・430px Chromium回帰

設計方針:
- 候補を正誤判定へ変換しない
- 条件不足では無理に分類しない
- 元MIDI / Normalized Song / SongProject / IndexedDBを変更しない
- main / stableを直接変更しない

復元ポイント:
- `restore/develop-before-note-resolution-v0.21-20261015`

Feature Branch:
- `chatgpt/note-resolution-v0.21`

完成Milestone:
- develop統合後に `chatgpt/v0.21-feature-complete-milestone` を作成する。
