# 曲データ共通メニュー — MIDI Analyzer

更新日: 2026-10-14

## 目的

MIDI AnalyzerでもJSON入出力場所を探さずに済むよう、画面右上へ `📦 曲データ` を常設する。

共通交換形式は従来どおり `SongProject v1` (`schemaVersion: 1`)。Schemaは変更しない。

## 操作

- `保存した曲を開く`: 解析前でも既存SongProject v1を選択できる。
- `今の曲を保存`: MIDI解析後、analysis / referenceを反映したSongProject v1を保存する。
- `Demo Composerへ進む`: JSONバックアップを保存し、同じChromeでは一時受け渡しも作成してDemo Composerへ進む。

## 既存SongProjectを先に開いた場合

選んだSongProjectはそのタブのsessionStorageだけで一時保持する。MIDI解析が完了すると既存Export処理へ渡し、今回のanalysis / referenceだけを書き戻す。

composition / arrangement / intent / history / assets / export / lineageは保持する。

## 安全性

- 次アプリへ進む場合もJSONバックアップを先に作る。
- localStorageの一時受け渡しは補助であり、保存JSONを復帰経路として残す。
- 解析前は「今の曲を保存」「Demo Composerへ進む」をdisabledにする。
- 360 / 390 / 430pxで横スクロールとConsole errorを回帰確認する。
