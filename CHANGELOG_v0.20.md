# CHANGELOG v0.20-dev

Version: v0.20-dev
更新日: 2026-10-15

## 【追加】
- Melody NoteのScale Tone / Non-Scale Tone分析。
- Chord ToneとScale Toneを独立して比較するNote Function Analyzer。
- 「Chord外・Scale内」「Chord内・Scale外」「両方の外側」の4分類。
- 初心者モードへ「音の役割」Metricを追加。
- 詳細MelodyへChord Tone / Scale Tone専用Panelを追加。
- `test/noteFunctionAnalysis.test.js`でChord ToneとScale Toneが独立概念であることを固定。
- `docs/NOTE_FUNCTION_ANALYSIS.md`。

## 【変更】
- Versionをv0.19-devからv0.20-devへ更新。
- Key候補選択、Chord候補選択、Chord分析Track変更、Melody Track変更時にNote Functionを再計算。
- README / ANALYSIS_SPECをv0.20-devの分析仕様へ同期。

## 【修正】
- Chord Tone / Non-Chord ToneとScale Tone / Non-Scale Toneを同じ意味として理解しやすかった情報設計を分離。
- Non-Chord Tone / Non-Scale Toneを誤りと受け取りにくい説明へ整理。

## 【互換性】
- Normalized Song Schema変更なし。
- SongProject v1 Schema変更なし。
- IndexedDB version 3変更なし。
- 元MIDI・保存済みMIDI・Clip・Stem・Memoを変更しないread-only Analysis Layerとして追加。
- mainへの直接変更なし。

## 【テスト】
- Key Analyzer形式のKey label parse。
- C major Key / C7でChord外・Scale内とChord内・Scale外を同時確認。
- Chromatic Noteが両方の外側として分類されることを確認。
- 同一Tickの代表Melody Note選択を既存Basic Analyzerと同じ優先順で確認。
- 既存全Unit / browser regression / production buildはGitHub CIで確認する。

## 【復元ポイント】
- `restore/develop-before-note-function-v0.20-20261015`

## 【未対応】
- Passing Tone / Neighbor Tone / Approach Note等の機能名の確定判定。
- harmonic / melodic minorを含むminor Scale表示の拡張。
- Android実機での最終タッチ確認。
- stable tag。実機gate通過後のみ作成する。
