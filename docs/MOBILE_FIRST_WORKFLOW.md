# Mobile-first Workflow

更新日: 2026-10-14

MIDI Analyzerは全体Workflowの任意工程として扱う。

`⓪ 作曲シート → ① MIDI解析（任意） → ② 作曲 → ③ 編曲 → ④ DAWへ`

## MIDI Analyzerの役割

- 参考MIDI・素材を理解したい時だけ使う。
- MIDI解析なしでもDemo Composerへ進める。
- Exportの初心者導線は `曲データを保存 → Demo Composerを開く → Demo Composerで反映` とする。
- SongProject v1 JSONは端末バックアップとして必ず保存する。
- 同一Chromeでは `music-project-songproject-handoff-v1` を補助的に利用する。
- 自動反映は行わない。

## スマホUI原則

- 画面内で主操作として強調するボタンは1つにする。
- Exportでは保存前は「曲データを保存」、保存後は「Demo Composerを開く」を主操作にする。
- 詳細Exportは「もっと詳しい書き出し」に収納する。
- 360 / 390 / 430pxで横overflowとConsole errorを回帰確認する。

## 互換性

- SongProject v1を変更しない。
- IndexedDB / MIDI / Clip / Stem Schemaを変更しない。
- 既存のAnalysis / CSV / Markdown / Chord Text / legacy project.json Exportを維持する。
