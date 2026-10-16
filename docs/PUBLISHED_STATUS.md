# PUBLISHED STATUS

最終更新: 2026-10-17

## 現在の公開版
- Version: `v0.26-dev`
- Public URL: `https://tamurayuuki46-cpu.github.io/midi-analyzer/`
- Public branch: `main`
- Publish PR: `#77`
- Public main commit: `ff3c64dfc56571acbc3d812acc31293e080bc354`
- Main CI #736: success
- GitHub Pages Deploy #36: success

## develop
- Version: `v0.26-dev`
- v0.26最終機能PR: `#76`（merged）
- 公開履歴sync PR: `#78`（merged）
- Develop sync commit: `a0129038493b380b8867b12370c637b167c8197d`
- 公開前develop復元Branch: `restore/develop-before-v0.26-publish-20261017`
- v0.26 PR CI #733: success
- v0.26公開PR CI #735: success

## 復元
- v0.26公開前main復元Branch: `restore/main-before-v0.26-publish-20261017`
- v0.26公開前develop復元Branch: `restore/develop-before-v0.26-publish-20261017`
- v0.25公開前main復元Branch: `restore/main-before-v0.25-publish-20261015`
- v0.24公開前main復元Branch: `restore/main-before-v0.24-publish-20261015`
- v0.24開発前復元Branch: `restore/develop-before-diagnostic-loop-v0.24-20261015`
- v0.24 feature-complete milestone: `chatgpt/v0.24-feature-complete-milestone`
- v0.24 dev-complete milestone: `chatgpt/v0.24-dev-complete-milestone`
- v0.25開発前復元Branch: `restore/develop-before-intent-loop-v0.25-20261015`
- v0.25 final milestone: `chatgpt/v0.25-final-milestone-20261015`

## Stable
stable tagは未作成。Android実機および必要なCubasis/Cubase実機確認後のみ作成する。

## v0.26の公開機能
- Analyzer / Archive画面分離
- Analyzer: MIDIを開く → 目的選択 → 「今見る3つ」
- Evidence → Meaning → Actionを主導線として表示
- Archive: MIDI / 素材保存・Audio→MIDI・Note修正・Stem・Clip Library・Key変更 / 12Key
- Analyzer / Archiveをhashで直接開き、Androidの戻る操作に対応
- AnalyzerではImport時の保存を初期OFF、Archiveでは初期ON
- 保存済みMIDI一覧から「Analyzerで開く」→同じ取り込み経路で再解析
- 保存済みMIDIの再解析時は再保存せず、既存Archiveデータを変更・複製しない

## 互換性
- SongProject v1変更なし
- IndexedDB `midi-analyzer` v3変更なし
- IndexedDB `midi-analyzer-stems` v1変更なし
- 分析エンジン / Higher-level Metrics / Export / savedTakesのSchema変更なし
- Migrationなし

## Publication verification
- v0.26公開PR `#77` のCIはUnit tests / Production build / Basic Pitch local model assets / Mobile Chromium regressionを含め成功。
- main merge後のMain CI `#736` とGitHub Pages Deploy `#36` も成功。
- Android実機PWA確認は未実施のためstableにはしていない。
