# CHANGELOG v0.26-dev

## Analyzer / Archive 画面分離（案B）

`docs/ANALYZER_ARCHIVE_SPLIT_PROPOSAL.md`（案B）の実装。同じRepository・同じPWA・同じ公開URL・同じIndexedDBのまま、画面とModule Ownerだけを分けた。

### 変更
- 先頭に `Analyzer`（曲を理解する）/ `Archive`（素材を保存する）の切替を追加。`#analyzer` / `#archive` のhashで直接開け、Androidの戻るで前の画面へ戻れる。最後に使った画面を端末内(localStorage)に覚える。
- **Analyzer**: MIDIを開く → 目的を選ぶ → **今見る3つ**（最大3件、既存v0.25 Intent-aware見直し候補を `Evidence → Meaning → Action` で表示）。基本5項目は折りたたみ、全タブは「詳細モード」。採点しない。
- **Archive**: 取り込み・保存済みMIDI・Audio→MIDI・Note修正・Stem・開いている曲のClip Library・Key変更/12Key。
- Library tabをAnalyzerの詳細タブから外した（13→12タブ）。Clip LibraryとKey変更はArchiveへ移動。
- 取り込みの保存チェックは Analyzer=OFF / Archive=ON が初期値。
- 旧「詳細ツールを表示」切替を廃止（Archive側は常に表示）。`midi-analyzer.start-mode.v1` は未使用になるだけで削除しない。

### 変更しないもの
Normalized Song / SongProject v1 / IndexedDB `midi-analyzer` v3 / `midi-analyzer-stems` v1 / 分析エンジン / Higher-level Metrics tab / Export tab / `savedTakes`。Migrationなし。

### 新規
`src/ui/appViews*.js|css`, `src/ui/appViewModel.js`, `src/ui/renderAnalyzerFocus.js`, `src/ui/analyzerFocusModel.js`, `src/ui/renderArchiveSong.js`, `test/appViews.test.js`。`renderDiagnosticLoop.js` は `INTENT_STORAGE_KEY` / `loadIntentId` をexportしただけ。

### 未対応（意図的）
- 保存済みMIDIをArchive一覧から再度Analyzerで開く導線（現状は削除のみ。保存済みの再解析は未実装）。
- Higher-level Metrics tabの縮小、Export tabのAnalysis/Material分割、AI Prompt / Personal Trendの扱い（提案書 §8 の判断待ち）。
- Android実機（PWA）での確認。
