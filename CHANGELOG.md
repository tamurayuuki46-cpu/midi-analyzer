# CHANGELOG

## Version: v0.3-dev
更新日: 2026-10-13

### 【追加】
- 2 MIDI比較（参考曲 vs 現在のMIDI）
- Key / BPM / Chord / Melody / Bass / Rhythm / Note密度 / 転調候補数の比較
- Top 1コード進行の使用Chord共通度
- IndexedDBに明示保存した複数MIDIから「自分の作曲傾向」を集計
- よく使うKey / Chord、平均BPM、Melody音域・密度、Bass移動、Rhythm密度、転調候補の集計
- `docs/COMPARE_SPEC.md`
- Compare / Personal Trend unit test 5件

### 【変更】
- 比較用の2曲目MIDIは一時解析だけ行い、自動保存しない
- 比較結果は差を表示するが、良し悪し・優劣として評価しない
- 保存済みMIDIの追加・削除後にPersonal Trendを再集計する
- 比率の差はpercentage pointで表示する
- Versionを`v0.3-dev`へ更新

### 【修正】
- 保存済みMIDI削除後に作曲傾向表示が古いまま残る状態を解消

### 【未対応】
- 比較する2曲のTrack手動対応付け
- Section単位の同期比較 / フレーズ時間伸縮比較
- 実MIDIによるKey / Chord係数・各heuristicの調整
- 保存済みMIDIの「開く」
- v0.4以降のPart詳細分析

## Version: v0.2.1-dev
更新日: 2026-10-13

### 【追加】
- 各Chord表示区間のランキング1位だけを時間順に抽出する`buildTopChordProgression`
- 「候補1位のコード進行」横スクロール表示
- コード進行内に小節番号 / Chord名 / 一致度を表示
- Top 1コード進行helper unit test 2件

### 【変更】
- Chord分析Trackを変更するとTop 1コード進行も自動再計算する
- 手動Chord選択とは別に、ランキング1位専用の仮コード進行として表示する
- Versionを`v0.2.1-dev`へ更新
- `VERSION` / `package.json` / 画面title / headerのVersion表示を同期

### 【修正】
- 公開画面のheader/titleに`v0.1-dev`表記が残っていた不整合を修正

### 【未対応】
- 実MIDIによるKey / Chord係数・Basic Analysis heuristic・Playback音量調整
- 保存済みMIDIの「開く」
- Top 1コード進行のコピー / Export / Demo Composer送信
- Slash Chordをv0.1 Chord選択値そのものとして確定する機能（v0.2ではDetail候補表示）
- Motifの反転 / augmentation / diminution / 曖昧一致
- Section境界の可変長推定（v0.2は4小節Block）
- pivot chord / common toneによる転調理由推定

## Version: v0.2-dev
更新日: 2026-10-13

### 【追加】
- 移調に依存しない4Note Motif反復候補
- Motif occurrence位置 / 回数 / 代表Pitch表示
- 4小節Block単位のSection候補
- Pitch Class分布 / Note密度 / 平均Pitch / 平均VelocityによるSection類似度
- 4小節BlockごとのKey Timeline
- 隣接BlockのKey変化から転調候補を表示
- 同主調 / 平行調 / 属調方向 / 下属調方向 / 半音 / 全音のKey関係表示
- 既存Chord候補に対する転回形 / Slash Chord候補
- add9 / 11 / 6・13のChord色付け候補
- 「発展分析」Panel
- `docs/ADVANCED_ANALYSIS_SPEC.md`
- Motif / Structure / Harmony Detail unit test

### 【変更】
- Versionを`v0.2-dev`へ更新
- 最終方針を「全部入りを段階追加する作曲分析Platform」へ更新
- v0.1 Chord Analyzerの候補順位は変更せず、v0.2 Chord Detailを上位Layerとして追加

### 【修正】
- 既存v0.1機能との互換性を維持したまま発展分析を追加

### 【未対応】
- 実MIDIによる各解析閾値調整
- 保存済みMIDIの「開く」

## Version: v0.1-dev
更新日: 2026-10-13

### 【追加】
- MIDI Import / Normalized Song / Track一覧 / Tempo / 拍子
- IndexedDB任意保存 / 一覧 / 削除
- Piano Roll
- Key / Scale Top 3
- Chord Top 3 / Degree / Track選択
- Melody / Bass / Rhythm基本分析
- Play / Stop簡易再生
- GitHub Pages自動公開
- Android Chrome基本実機確認

### 【変更】
- Analyzerは候補を提示し、自動確定しない
- 保存OFF時は元MIDIを永続化しない

### 【修正】
- Playback lifecycle / Pages asset path / Pages deploy構成を修正

### 【未対応】
- 実MIDI係数・音量調整
- 保存済みMIDIの「開く」
