Version: v0.13-dev
更新日: 2026-10-14

【追加】
・Export画面に初心者向け「Demo Composerへ渡す」導線を追加。
・「1. 曲データを保存 → 2. Demo Composerを開く → Demo Composerで反映」の3段階に整理。
・SongProject v1をJSONバックアップとして必ず保存し、同じChromeではlocalStorageを補助導線として一時受け渡しする。
・別ブラウザや一時受け渡し失敗時は、保存したSongProject JSONを選んで続行できる。
・JSON handoff guide unit testと360/390/430px Chromium回帰を追加。

【変更】
・Analysis JSON / CSV / Markdown / Chord Text / 旧Demo Composer project.json等は「もっと詳しい書き出し」へ収納。
・初心者向けの主操作ではJSON / Schemaという技術用語を前面に出さない。

【修正】
・解析後に「どのJSONを保存し、次に何をするか」が分かりにくかった導線を改善。

【互換性】
・SongProject schemaVersion 1据え置き。
・既存Analysis Export / Demo Composer legacy export / Shareを維持。
・既存MIDI / Clip / Stem / IndexedDBを変更しない。

【復元ポイント】
・`restore/develop-before-json-handoff-guide-20261014`

【未対応】
・Android実機でMIDI Analyzer → Demo Composer → Arrangement Labの通し確認。
・長尺Audio / MP3 / M4A、Cubasis / Cubase実機確認。
・stable tag作成（実機確認後のみ）。
