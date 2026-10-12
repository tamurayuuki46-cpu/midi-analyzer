# CHANGELOG

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
- 2 MIDI比較以降の機能はROADMAPに従い段階実装

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
- Motif unit test 2件
- Structure / Modulation unit test 2件
- Harmony Detail unit test 2件

### 【変更】
- Versionを`v0.2-dev`へ更新
- 最終方針を「全部入りを段階追加する作曲分析Platform」へ更新
- ROADMAPをv0.3〜v1.0までCompare / Part Deep Analysis / Visualization / Library / Integration / AI Explanation / Higher-level Metricsへ再編
- v0.1 Chord Analyzerの候補順位は変更せず、v0.2 Chord Detailを上位Layerとして追加

### 【修正】
- 既存v0.1機能との互換性を維持したまま発展分析を追加

### 【未対応】
- 実MIDIによるKey / Chord係数・Basic Analysis heuristic・Playback音量調整
- 保存済みMIDIの「開く」
- Slash Chordをv0.1 Chord選択値そのものとして確定する機能（v0.2ではDetail候補表示）
- Motifの反転 / augmentation / diminution / 曖昧一致
- Section境界の可変長推定（v0.2は4小節Block）
- pivot chord / common toneによる転調理由推定
- 2 MIDI比較以降の機能はROADMAPに従い段階実装

## Version: v0.1-dev
更新日: 2026-10-13

### 【追加】
- 初期Repository / 共通仕様書 / AI共同開発ルール
- MIDI Import / `midi-file@1.2.4` Parser Adapter / Song正規化
- Tempo Map / Time Signature / Track一覧 / Warning
- Normalizer unit test 7件 / GitHub Actions CI
- IndexedDB端末保存（初期OFF）/ 元MIDI + Song / 一覧 / 削除
- IndexedDB unit test 4件 / STORAGE_SPEC
- 読み取り専用Piano Roll / Track切替 / Zoom / Scroll
- Piano Roll model unit test 7件 / PIANO_ROLL_SPEC
- 固定binary MIDI Parser integration regression test 2件
- Key / Scale Analyzer（major/minor 24候補 → Top 3）
- Key候補ユーザー選択UI / Key Analyzer unit test 6件 / KEY_ANALYZER_SPEC
- Chord Analyzer（12 root × 10 template → Top 3）
- Chord分析対象Track選択UI
- overlapDurationTick × velocityによるChord Pitch Class重み
- Bass Bonus / Non-Chord Penalty / sparse confidence reduction
- Chord切替閾値10% / 同一小節内連続Chord集約
- Degree表示 / 選択Key連動 / 音階外表示
- Chord Analyzer unit test 10件
- `docs/CHORD_ANALYZER_SPEC.md`
- Melody基本分析（音域 / 最大・平均跳躍 / 同音連打 / 密度 / Chord Tone比率）
- Bass基本分析（最低音移動 / Root・3rd・5th・Other / リズム型）
- Rhythm基本分析（拍位置 / シンコペーション候補 / 密度 / 16分Grid）
- Melody / Bass / Rhythm分析対象Track選択UI
- Chord選択・Chord分析Track変更に連動したMelody / Bass再計算
- Basic Analysis unit test 9件
- `docs/BASIC_ANALYSIS_SPEC.md`
- 曲頭からの最小Play / Stop簡易再生
- Tempo Map対応Tick→seconds変換 / 50ms scheduler / 約180ms lookahead
- 通常Noteのtriangle oscillator簡易音 / Channel 10の短いclick
- Stop / 再Import時のAudioContext破棄
- Playback timing unit test 9件 / controller lifecycle test 3件
- `docs/PLAYBACK_SPEC.md`
- GitHub Pages自動公開Workflow
- hosting非依存のVite相対asset path設定
- `docs/DEPLOYMENT.md`

### 【変更】
- Motifはv0.2以降
- Trackは `channels[]`、DrumはNote.channel === 9を基本判定
- 6/8ではanalysisGridとmusicalBeatを分離
- 保存失敗とImport失敗を分離
- Key / Chord confidenceは確率ではなく一致度として表示
- Chordは全Trackを無条件に混ぜず、ユーザー選択Trackだけを分析
- Chord Tone / Bass Chord Roleは選択Chordを優先し、未選択時は第1候補を仮使用して前提を表示
- Rhythmのシンコペーションはv0.1では「musicalBeat拍頭以外」の簡易候補として扱う
- Playbackは元音色再現ではなくTiming / Pitch / Rhythm確認用の簡易プレビューに限定
- v0.1機能Scopeは実装完了
- 標準公開先をVercel必須構成からGitHub Pages単独で運用可能な構成へ変更
- Android ChromeでImport / Storage / Playback / Piano Roll / Key / Chord / Basic Analysisの基本実機確認を完了

### 【修正】
- Claude引き継ぎ案と既存仕様の矛盾整理
- mixed Channel TrackのDrum表示
- PWA manifest path
- 再生開始中の二重Playを防止
- AudioContext resume中のStop / 再Importで旧sessionが復帰しないようlifecycleを修正
- GitHub Pagesのproject path配下でbuild assetが404にならないようVite baseを相対化
- GitHub Pagesの`develop`公開が環境保護設定でjob開始前に失敗する構成を避けるため、deploy jobのEnvironment依存を除去

### 【未対応】
- 実MIDIによるKey / Chord係数・Basic Analysis heuristic・Playback音量調整
- 保存済みMIDIの「開く」
