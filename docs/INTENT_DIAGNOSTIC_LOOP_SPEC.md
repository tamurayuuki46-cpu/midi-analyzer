# INTENT_DIAGNOSTIC_LOOP_SPEC.md

## Version
v0.25-dev

## 目的
v0.24のDiagnostic Loopを作り直さず、そのEvidenceを「今回の作曲意図に対して、何を1項目だけ試すと違いを確認しやすいか」へ接続する。

本機能はRead-only / proposal-only Layerであり、品質Score、正解判定、自動作曲、自動編曲、自動Mergeを行わない。

## 基本フロー

`目的を選ぶ → Evidenceを読む → TOP 3を並べ替える → 1項目だけ選ぶ → Arrangement Labへ渡す → 修正前/修正後を再分析 → 採用/見送りを端末内記録`

## 1. ユーザー意図
次の意図を選択できる。

- 特徴を確認したい
- Sectionの差を強めたい
- サビ候補を持ち上げたい
- 緊張感・浮遊感を試したい
- 着地・終止感を変えたい
- Climax位置・展開重心を調整したい

意図は既存Evidenceの優先順にだけ影響する。品質Scoreには変換しない。
Verse / Bメロ / Chorus等のSection役割を自動確定しない。

## 2. Intent-aware TOP 3
候補はv0.24と同じ分析Evidenceを使う。

- Section Note密度差
- Section別Melody音域
- Section終端Landing
- Chord Tone / Non-Chord Tone比率
- Climax候補位置

v0.25では各候補へ以下を追加する。

- `rationale`: なぜ今回の意図に対して比較価値があるか
- `targetSections`: 比較対象Section候補
- `experiment`: 1変数実験

内部の並べ替え値は公開JSON/UIへ出さない。

## 3. 1変数実験
各候補は次を持つ。

- `variable`: 今回変える1項目
- `targetSections`: 対象Section
- `keepConstant`: 変えない要素
- `choices`: A/B/C等の比較方向
- `verification`: 再分析時に確認する指標

複数要素を同時に変更して効果の原因が分からなくなることを避ける。
A/B/Cは正解候補ではなく比較用の方向である。

## 4. Arrangement Lab handoff
既存互換性を維持するため次を維持する。

- `schemaVersion: 1`
- `type: midi-analyzer-arrangement-handoff`
- `mode: proposal-only`

v0.25ではユーザーが選んだ1候補だけを渡し、追加情報として次を含める。

- `userIntent`
- 選択したPriority 1件
- `experiment`
- `rationale`
- `targetSections`

AnalyzerはReharmonize / Voicing / 密度変更 / 編曲案生成を実行しない。
実際の案生成・採用判断はArrangement Labの責務とする。

## 5. 修正前 / 修正後
v0.24のCompare機能をそのまま利用する。

Arrangement Lab等で試した後、修正前MIDIと現在MIDIを比較し、同じ診断指標を再計算する。
変化量は改善度ではない。

## 6. 採用 / 見送り履歴
選択した実験についてユーザーが明示操作で次を記録できる。

- 採用
- 見送り

保存先は`localStorage`のみ。
記録内容:

- 記録日時
- source file name
- user intent
- priority id / title
- experiment variable
- decision

SongProject / IndexedDB Schemaは変更しない。
クラウドへ自動送信しない。

## データ安全性
- 元MIDIを変更しない
- Normalized Song変更なし
- SongProject v1変更なし
- IndexedDB `midi-analyzer` version 3維持
- Stem DB version 1維持
- 保存済みデータの自動Migrationなし
- Arrangement Labへ自動Mergeしない
- 内部順位を品質Scoreとして公開しない
- localStorage履歴をCompositionデータへ自動反映しない

## UI
Structure内のDiagnostic Loopを次の順に表示する。

1. 今回の目的
2. Section比較
3. 分析値の意味
4. 目的に合わせた見直し候補 TOP 3
5. 1項目実験の詳細
6. 選んだ1項目をArrangement Labへ渡す
7. 採用 / 見送り記録
8. 端末内履歴

Android Chrome 360 / 390 / 430pxで横スクロールを増やさない。
操作ボタンは44px以上のタップ領域を確保する。

## テスト
- intent選択でTOP3の優先順が変わる
- TOP3上限3件
- 内部score / weight非公開
- rationale / experiment生成
- 1変数実験にkeepConstant / choices / verificationがある
- handoff Schema v1互換
- 選択した1Priorityだけhandoff
- 元Song非破壊
- v0.24既存diagnostic testを回帰実行
- production build
- Basic Pitch model asset regression
- mobile Chromium regression
