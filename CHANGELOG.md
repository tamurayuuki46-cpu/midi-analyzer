# CHANGELOG

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
- slash chord専用表記
