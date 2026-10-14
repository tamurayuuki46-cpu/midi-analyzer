Version: v0.14-dev
更新日: 2026-10-14

【追加】
・全体導線を `⓪ 作曲シート → ① MIDI解析（任意） → ② 作曲 → ③ 編曲 → ④ DAW` の5段階で表示。
・360 / 390 / 430pxのMobile Chromium回帰に5段階表示と主ボタン切替の確認を追加。

【変更】
・Exportの初心者導線は「曲データを保存」を最初の唯一の主操作とし、保存成功後は「Demo Composerを開く」を唯一の主操作へ切り替える。
・公開mainのRecorderタブは今回のReleaseでも維持し、回帰テスト対象に含める。
・⓪作曲シートは未公開Moduleへリンクせず、Demo Composer Project HomeのClaude Artifact作曲シート登録欄へ案内する。

【修正】
・develop版のモバイル回帰をmainへそのまま持ち込むとRecorderの有無で不整合になるため、公開mainのUI構成に合わせてE2Eを調整。

【互換性】
・SongProject v1据え置き。
・IndexedDB / MIDI / Clip / Stem / Recorder Takeの既存データを維持。
・Analysis JSON / CSV / Markdown / Chord Text / legacy project.json書き出しを維持。

【復元ポイント】
・`restore/main-before-mobile-first-flow-20261014`

【未対応】
・Android実機確認。
・Cubasis / Cubase実機確認。
・stable tag作成（実機確認後のみ）。
