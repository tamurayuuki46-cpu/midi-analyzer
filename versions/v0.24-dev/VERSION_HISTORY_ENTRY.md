# v0.24-dev VERSION HISTORY ENTRY

更新日: 2026-10-15
状態: develop統合済み / CI合格 / main未公開

## 主な内容
- Section比較: Note密度 / Melody音域 / Chord Tone率 / 着地Degree
- 分析値の自然言語Meaning
- 見直し候補 TOP 3
- Arrangement Lab向けproposal-only handoff JSON
- 修正前 / 修正後の再分析

## 設計方針
- Analyzerは「曲を理解する」責務を維持する。
- 見直し候補は品質判定ではなく、差を試して確認しやすい観点の順位。
- Reharmonize / Voicing / 密度変更 / 採用判断はArrangement Labの責務。
- 自動Upload / 自動Mergeなし。
- SongProject / IndexedDB Schema変更なし。

## 開発・統合
- Feature branch: `chatgpt/diagnostic-loop-v0.24`
- PR: `#65`
- develop統合commit: `71bb387f41056bf15a489a6a2a4983775666f1c5`
- develop統合後CI: success
  - Unit tests: success
  - Production build: success
  - Basic Pitch local model assets: success
  - Mobile Chromium 360 / 390 / 430px regression: success
- Feature-complete milestone: `chatgpt/v0.24-feature-complete-milestone`

## 変更前復元ポイント
- `restore/develop-before-diagnostic-loop-v0.24-20261015`
- base develop: `24aa53240a3ff0ab0794569459614baa85e7335f`

## 公開状態
- `main` / GitHub Pagesは `v0.23-dev` のまま。
- v0.24のmain昇格・公開は本番公開操作になるため未実施。

## stable tag
- 未作成。Android実機および必要な外部連携確認後のみ作成する。
