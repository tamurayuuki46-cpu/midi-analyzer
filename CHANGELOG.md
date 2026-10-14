## v0.11-dev
更新日: 2026-10-13

【追加】
・360/390/430pxのMIDI取込・全解析タブ・Key変更・保存/再読込・Console回帰をCIへ追加。
・Basic Pitch生成MIDI→既存Parser→正規化→Analysis Bundleの統合回帰テスト。

【変更】
・Normalized Song/Noteのoriginに既存Audio UIが使うbasic-pitchを許可。旧originと保存データを保持。

【修正】
・Audio変換完了後に「未対応のoriginです: basic-pitch」となり解析・Note編集結果の反映が失敗する問題を修正。

【未対応】
・Android実機、長尺Audio、MP3/M4A、Cubasis/Cubase実機確認。stable tag未作成。

# CHANGELOG

## v0.10-dev — 2026-10-13 main統合・公開後の整合性修正

- SongProject v1 / Basic Pitch / Key変更 / Stem連携の実装詳細: `versions/v0.10-dev/CHANGELOG_v0.10-dev.md`。
- PR #19: 運用変更、PR #20: main昇格、PR #21: main CI gate、PR #22/#23: Pages公開元をmainへ変更。
- mainでUnit tests / Production build / Basic Pitch model検証・Pages Deploy成功。
- README / AI_HANDOFFの旧Version・公開Branch記載を修正。Version番号・Schema・アプリ処理は維持。
- Android/Cubasis/Cubase実機確認は未完了、stable tag未作成。


## Version: v0.9-dev
更新日: 2026-10-13

### 【追加】
- `Export` Tab
- Demo Composer `project.json` Schema 3 Export Adapter
- Analyzer PPQからDemo Composer PPQ 480への比例変換
- JSON / CSV / Markdown解析Report Export
- Chord / Degree Text Export
- Android共有メニューへのDemo Composer project.json受け渡し
- 共通`buildAnalysisBundle`による既存Analyzer結果の統合
- `AI` Tabの端末内Explainability Report
- なぜこのKey / Chord / 転調候補なのかの根拠説明
- 「この曲から学べること」/ 作曲へ応用する候補
- 外部AIへ手動で渡すPrompt package Export
- `Metrics` Tab
- 浮遊感候補Score
- サビらしさ候補Score / Section ranking
- 驚き度 / 転調Impact候補Score
- 反復と変化のBalance候補Score
- 裏メロ存在感候補Score
- 編曲密度候補Score
- 各ScoreのEvidence表示
- RipX Bridge Prototype (`npm run bridge -- path/to/song.mid`)
- PC上の指定MIDIをLAN経由でAndroidへDownloadするTransfer page
- v0.7 Integration / v0.8 Explanation / v0.9 Metricsの回帰テスト

### 【変更】
- Versionを`v0.9-dev`へ更新
- Tab navigationを`概要 / Harmony / Melody / Bass / Rhythm / Structure / Visual / Compare / Library / Recorder / Export / AI / Metrics / Parts`へ拡張
- AI Tabを「準備中」から端末内Explainability機能へ変更
- v0.9 Scoreは0〜100の候補指標とし、品質・人気・正解の採点には使わない
- Demo Composer連携ではSection候補をVerse/Chorusへ勝手に確定せず、確定できない構成名は自動固定しない
- 外部AIへのMIDI / Analysis自動送信は行わない

### 【修正】
- Demo Composer現行SchemaのPPQ 480 / 4/4制約をExport時にWarningとして明示
- Key候補が取得できない場合にDemo Composer Projectを壊さずC major初期値へFallback
- Export / Explanation / Metrics追加時も元Song / Note / Analyzer候補順位を変更しないことをテストで固定

### 【未対応】
- v1.0 全機能統合 / Android UI最適化 / Performance最適化 / Stable化
- Android実機でRecorder / Export / Bridgeの最終確認
- 実MIDIによるv0.9 Score閾値・係数の追加チューニング

## Version: v0.7-dev
更新日: 2026-10-13

### 【追加】
- `Recorder` Tab
- Melody / Chord / Bass / DrumのPart別Track候補
- Recorder TabでのTrack手動選択
- Web Audio簡易音源 → MediaRecorderによるパート分離Audio録音
- 録音中Monitor ON / OFF
- 録音Takeの端末内保存 / Preview再生 / 削除
- Take A / Bセットと個別再生
- MediaRecorderのmimeTypeに合わせたAudio書き出し（WebM / M4A / OGG等）
- IndexedDB `savedTakes` Store
- IndexedDB v1→v3 / v2→v3 Migration test
- Part Recorder model / controller lifecycle unit test
- `docs/PART_RECORDING_SPEC.md`

### 【変更】
- IndexedDB Database versionを2→3へ更新
- 既存`savedMidis` / `savedClips`を保持し、新しい`savedTakes`だけ追加
- Tab navigationを12カテゴリへ更新
- Versionを`v0.7-dev`へ更新
- 再Import前に録音Controllerをdestroyし、旧録音sessionを停止する

### 【修正】
- v2→v3 Migrationで保存済みMIDI / Clipを削除・変換しないことを自動テストで固定
- Part録音時は選択TrackだけをPart Songへfilterし、元Songを変更しない

### 【未対応】
- Android実機でMediaRecorder / Audio書き出し最終確認
- WAV固定renderer
- マイク / 外部Audio input
- RipX / Cubasis / Cubaseなど他アプリ内部Audioの直接録音
- 同時Multi Stem録音
- Demo Composer Export Adapter
- JSON / CSV / Markdown Report
- Chord / Degree text export
- RipX Bridge / PC→Android転送
- 実MIDIによる各Analyzer閾値調整

## Version: v0.6-dev
更新日: 2026-10-13

### 【追加】
- Chord / Melody / Bass / Drum / Motifの4小節Clip保存
- 連続4小節Range選択（8小節なら1–4〜5–8）
- Clip内NoteをRange先頭0tickへ相対化して保存
- Genre / Mood / BPM / Key / custom tag
- Top 1 Chord progressionをClip contextとして保存
- Clip名・種類・source・Genre・Mood・BPM・Key・custom tag・Chord名のAND検索
- Library Tab内のClip保存Form / Search / Card / Delete UI
- IndexedDB `savedClips` Store
- IndexedDB v1→v2 Migration test
- Clip model / search unit test
- `docs/CLIP_LIBRARY_SPEC.md`

### 【変更】
- IndexedDB Database versionを1→2へ更新
- 既存`savedMidis` Storeは保持し、新しい`savedClips`だけ追加
- Library Tabを「保存済みMIDI」と「Clip Library」に分離
- BPM / Keyは保存Rangeから自動Tag、Genre / Mood / custom tagは任意入力
- Chord進行DBをClip LibraryのChord contextとして統合
- Versionを`v0.6-dev`へ更新

### 【修正】
- v1→v2 Migration時に既存保存済みMIDI recordを削除・変換しないことを自動テストで固定
- Clip Range境界をまたぐNoteはClip側だけ切り詰め、元Songを変更しない

### 【未対応】
- ClipからMIDI binaryを書き出す機能
- Clip編集 / Quantize
- Clip Trackの手動対応付け
- Cloud同期 / Demo Composer送信
- 保存済みMIDIの「開く」
- Android実機でClip保存 / 検索 / 削除の最終確認
- 実MIDIによる各Analyzer閾値調整

## Version: v0.5-dev
更新日: 2026-10-13

### 【追加】
- Visual Tab
- Tonal Center Timeline
- Chord Timeline（各区間Top 1候補）
- Melody / Bass Contour
- Rhythm Density / Energy Curve
- Section Map
- Note / Velocity Heatmap（Pitch Class × 小節、先頭16小節）
- `buildVisualizationModel`
- `docs/VISUALIZATION_SPEC.md`
- Visualization unit test 2件

### 【変更】
- Tab順に`Visual`を追加
- Energy CurveをMIDI onset密度 × average velocityの曲内正規化指標として定義
- 可視化は既存Analyzer結果とNormalized Songの表示Layerに限定し、候補順位や元Noteを変更しない
- Versionを`v0.5-dev`へ更新

### 【修正】
- Visual Tab追加に合わせてTab navigation testを11カテゴリへ更新

### 【未対応】
- full-song Heatmapの無制限描画
- Audio waveform / spectral分析
- 実MIDIでの表示密度・閾値調整
- Android実機でVisual Tab横スクロール確認

## Version: v0.4.1-dev
更新日: 2026-10-13

### 【追加】
- 解析結果を「概要 / Harmony / Melody / Bass / Rhythm / Structure / Compare / Library / AI / Parts」へ分けるTab UI
- Android向け横スクロールTab列
- WAI-ARIA `tablist` / `tab` / `tabpanel`
- 左右矢印 / Home / EndによるTabキーボード操作
- `tabModel`純粋ロジックとunit test 3件

### 【変更】
- 概要へ基本情報 / Playback / Track一覧 / Piano Rollを集約
- HarmonyへKey / Chord / Degree / Chord Detailを集約
- Melodyへ主旋律基本分析 + 裏メロ候補を集約
- Bassへ基本分析 + Bass詳細を集約
- Rhythmへ基本分析 + Drum詳細を集約
- StructureへMotif / Section / 区間Key / 転調候補を集約
- Compare / Library / Partsを専用Tab化
- Import後の保存済みMIDI一覧をLibrary Tabへ移動
- AI Tabは将来機能用の準備中表示とし、自動AI解析は実行しない
- Versionを`v0.4.1-dev`へ更新

### 【修正】
- Import後に保存済みMIDI一覧が画面上部とLibrary内で二重表示されないよう整理
- カテゴリ分割後もChord選択変更時のMelody / Bass再計算を維持

### 【未対応】
- AI説明機能本体
- 保存済みMIDIの「開く」
- Libraryのタグ検索 / Clip管理
- 実MIDIによる各解析閾値の調整
- Android実機で全Tabの最終タップ/スクロール確認

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

## 記入シート簡易版 v0.6 — 2026-10-14
右上「曲データ」から読み込んだSongProjectの記入用シートを参照。解析・Schema・本体Versionは維持。
