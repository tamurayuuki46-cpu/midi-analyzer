# CHANGELOG

## Version: v0.4-dev
更新日: 2026-10-13

### 【追加】
- 裏メロ候補分析: 反行 / 並行 / 斜行 / 主旋律の隙間 / 2度衝突候補 / 上下Register
- Bass詳細分析: ペダル候補 / オクターブ移動 / 半音進行 / 順次進行 / 次Chord Root接近候補
- Drum詳細分析: GM Drum大分類 / 使用GM Note / Fill候補
- MIDI Track役割候補: Melody / Chord / Bass / Drums / Other
- Android向けPart Deep Analysisパネル
- `docs/PART_DEEP_ANALYSIS_SPEC.md`
- Part Deep Analyzer unit test 5件

### 【変更】
- 裏メロの短2度/長2度同時発音は「衝突候補」として表示し、悪いとは評価しない
- FillはTom集中または小節内onset密度上昇から候補化する
- Track役割は候補表示のみで、Normalized SongのroleHintを自動書換しない
- Versionを`v0.4-dev`へ更新

### 【修正】
- なし

### 【未対応】
- 裏メロTrackのユーザー手動指定UI
- Voice Leadingの完全な和声学判定
- Drum Fillの高度なpattern分類
- Program Changeを使った楽器種別推定
- 実MIDIによる各閾値の調整

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

## Version: v0.2.1-dev
更新日: 2026-10-13

### 【追加】
- 各Chord表示区間のランキング1位だけを時間順に抽出
- 「候補1位のコード進行」横スクロール表示
- 小節番号 / Chord名 / 一致度を表示

### 【変更】
- Chord分析Track変更時にTop 1コード進行を再計算
- 手動Chord選択とは別管理

### 【修正】
- 画面Version表記の不整合を修正

### 【未対応】
- 実MIDI調整 / 保存済みMIDIの「開く」 / Export

## Version: v0.2-dev
更新日: 2026-10-13

### 【追加】
- Motif / Section / 区間Key / 転調候補
- Slash Chord / Chord Detail

### 【変更】
- 全部入りを段階追加するROADMAPへ更新

### 【修正】
- v0.1互換性を維持して発展分析を追加

### 【未対応】
- 実MIDI閾値調整

## Version: v0.1-dev
更新日: 2026-10-13

### 【追加】
- MIDI Import / Storage / Piano Roll / Key / Chord / Degree / Melody / Bass / Rhythm / Play・Stop
- GitHub Pages自動公開 / Android Chrome基本確認

### 【変更】
- Analyzerは候補を提示し自動確定しない

### 【修正】
- Playback lifecycle / Pages公開構成

### 【未対応】
- 実MIDI係数・音量調整 / 保存済みMIDIの「開く」
