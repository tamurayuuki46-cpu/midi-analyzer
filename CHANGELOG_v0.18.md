# MIDI Archive/Analyzer v0.18-dev

更新日: 2026-10-15

## 追加
- 読み込み前の初心者スタート画面を追加。
- 最初に「MIDIを保存・整理する」と「MIDIを解析する」の2択を表示。
- 「保存済みMIDIを見る」「詳細ツールを表示 / 隠す」を追加。
- 初心者スタートの表示設定を `midi-analyzer.start-mode.v1` に端末内保存。
- 360 / 390 / 430px Mobile Chromium回帰に初心者スタートを追加。

## 変更
- アプリ表示名を `MIDI Analyzer` から `MIDI Archive/Analyzer` へ変更。
- Browser title / Header / PWA `name` / `short_name` を新名称へ統一。
- Versionを `v0.18-dev` / package `0.18.0-dev` へ更新。
- 初心者時は Audio→MIDI / Note Tools / Stem Reference を初期状態で隠し、必要時だけ表示する。
- MIDI読み込み後は従来どおり初心者分析を最初に表示し、5項目要約→良いところ→改善候補→次に試すことの順で確認する。

## 互換性
- Repository名 `midi-analyzer` は変更しない。
- 公開URL `https://tamurayuuki46-cpu.github.io/midi-analyzer/` は変更しない。
- SongProject v1 / IndexedDB / Clip / Stem / localStorageの既存キーを破壊しない。
- 既存13解析タブを削除しない。
- 元MIDI・Normalized Song・既存Analyzer候補順位を変更しない。

## 未対応
- Android実機で初心者スタートのタッチ操作を最終確認。
- Cubasis / Cubase実機確認。
- stable tagは実機確認後のみ作成する。
