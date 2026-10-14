Version: v0.14-dev
更新日: 2026-10-14

【追加】
・スマホ画面へ `⓪ 作曲シート → ① MIDI解析（任意） → ② 作曲 → ③ 編曲 → ④ DAW` の全体Workflowを追加。
・MIDI解析が必須ではないことをImport前から明示。
・Export導線に「今やること」を追加。

【変更】
・SongProject保存前は「1. 曲データを保存」だけを主ボタンとして強調し、保存後は「2. Demo Composerを開く」へ主ボタンを移す。
・Analysis JSON / CSV / Markdownのファイル名Versionをv0.14へ更新。
・360 / 390 / 430px回帰へ全体Workflow・主ボタン1個の検証を追加。

【修正】
・なし。

【互換性】
・SongProject v1据え置き。
・IndexedDB / MIDI / Clip / Stem Schema変更なし。
・`music-project-songproject-handoff-v1` 据え置き。

【未対応】
・Android実機確認。
・Cubasis / Cubase実機確認。
・stable tag作成（実機確認後のみ）。
