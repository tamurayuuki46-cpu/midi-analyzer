# DIAGNOSTIC_LOOP_SPEC.md

## Version
v0.24-dev

## 目的
MIDI Analyzerの既存Evidenceを、作曲者が「次に何を比較すると違いが分かりやすいか」へつなげる。

本機能は診断・説明・提案のRead-only Layerであり、曲の品質Score、正解判定、自動作曲、自動編曲を行わない。

## 1. Section比較
既存Structure AnalyzerのSection候補ごとに次を並べる。

- Note密度
- Melody音域
- Melody Note数
- 平均Pitch
- Chord Tone率
- Section終端のPitch / Degree / relation

隣接Sectionでは密度差、Melody音域差、Chord Tone率差を文章化する。
A/B/C等のSection候補をVerse / Bメロ / Chorusへ自動確定しない。

## 2. 分析値の意味付け
数値だけで終わらせず、EvidenceとMeaningをセットで表示する。

例:
- Section密度差が小さい → 「Section同士の発音密度は近い傾向」
- Chord Tone率が高い → 「Chord Tone上のMelody Noteが多い傾向」

Meaningは良い / 悪いを判定しない。

## 3. 見直し候補 TOP 3
内部weightで、変化を試した時に違いを確認しやすい観点を最大3件に絞る。

候補:
- Section密度差
- Section別Melody音域
- Section終端の着地
- Chord Tone / Non-Chord Tone比率
- Climax候補位置

公開データへweightや品質Scoreを出さない。
各項目は `Evidence → Meaning → Action` を持つ。

## 4. Arrangement Lab handoff
ユーザーの明示操作「Arrangement Labへ渡す」で、次のJSONを生成する。

- schemaVersion: 1
- type: `midi-analyzer-arrangement-handoff`
- mode: `proposal-only`
- source app/version/file/PPQ
- 見直し候補TOP3
- intent
- targetSections
- Evidence / Meaning / Action

対応端末ではOS共有メニューへ渡し、未対応端末ではJSONをDownloadする。
自動Upload、自動送信、SongProject自動Mergeは行わない。

責務境界:
- MIDI Analyzer: 観測、意味付け、比較候補の提案
- Arrangement Lab: Reharmonize、Voicing、密度変更、編曲案生成、採用判断

## 5. 修正前 / 修正後の再分析
Compare Tabの比較用MIDIを「修正前」、現在読み込んでいるMIDIを「修正後」として、同じ診断指標を再計算する。

表示候補:
- Section間Note密度差
- Section間Melody音域差
- 着地Degree種類数
- 平均Chord Tone率
- 曲全体Melody音域
- Climax候補位置

変化量は改善度ではない。
修正前TOP3について、修正後も同じ観点がTOP3に残るかを再確認できる。

## データ安全性
- 元MIDIを変更しない
- Normalized Songを変更しない
- SongProject Schemaを変更しない
- IndexedDB Schemaを変更しない
- 保存済みデータを自動Migrationしない
- Arrangement Labへ自動Mergeしない
- 既存Analyzerの候補順位を変更しない

## UI
### Structure
- Section比較
- 分析値の意味
- 見直し候補 TOP 3
- Arrangement Labへ渡す

### Compare
- 既存「参考曲 vs 現在MIDI」を維持
- 同じ2 MIDIを「修正前 → 修正後」として再分析

Android Chrome 360 / 390 / 430pxで横スクロールを増やさない。

## テスト
- Section比較と隣接差分
- Evidence / Meaning生成
- TOP3上限と内部weight非公開
- Arrangement handoff Schemaと元Song非破壊
- 修正前後の再分析差分
- 既存unit test / production build / model asset regression
