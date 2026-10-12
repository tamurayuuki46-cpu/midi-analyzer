# VERSION_HISTORY

## v0.7-dev — 2026-10-13
状態: Part Recording Scope実装完了 / Unit Test・Production Build確認中

主な内容:
- Recorder Tab
- Melody / Chord / Bass / Drum Part Track候補
- Track手動選択
- Web Audio簡易音源をMediaRecorderでPart別Audio録音
- Monitor ON/OFF
- Take保存 / Preview / 削除
- Take A/B比較
- Browser対応Audio形式で書き出し
- IndexedDB version 3 / `savedTakes` Store
- v1→v3 / v2→v3非破壊Migration test
- Part Recorder model / controller lifecycle test

設計方針:
- 元MIDI / Normalized Songを録音時に変更しない
- 他アプリ内部Audioやマイク入力はv0.7 Scope外
- MediaRecorder形式はブラウザ対応形式を使い、WAV固定にはしない
- v2の`savedMidis` / `savedClips`を削除・変換せず維持する
- Recorderは既存Playback / Analyzerとは独立Controllerとして扱う

復元ポイント:
- `chatgpt/v0.6-before-part-recorder`

## v0.6-dev — 2026-10-13
状態: Clip / Library Scope実装完了 / Unit Test・Production Build確認済み / GitHub Pages公開済み

主な内容:
- Chord / Melody / Bass / Drum / Motifの4小節Clip
- 連続4小節Range切り出し
- Clip内Noteの相対tick化 / Range境界Clip
- Genre / Mood / BPM / Key / custom tag
- Top 1 Chord progression context
- Clip検索 / 削除
- Library Tabを保存済みMIDI + Clip Libraryへ分割
- IndexedDB version 2 / `savedClips` Store
- v1→v2非破壊Migration
- Clip model / IndexedDB migration自動テスト

設計方針:
- v1の`savedMidis`を削除・変換せず維持する
- Clip保存はユーザーの明示操作のみ
- 元Song / 元MIDIをClip作成時に変更しない
- ClipのKey / ChordはAnalyzer候補contextであり確定値ではない
- Chord進行DBはClip Libraryへ統合する

復元ポイント:
- `chatgpt/v0.6-before-clip-library`
- `chatgpt/v0.6-feature-complete-milestone`
- `chatgpt/v0.6-published-milestone`

## v0.5-dev — 2026-10-13
状態: Visualization Scope実装完了 / Unit Test・Production Build確認済み

主な内容:
- Tonal Center Timeline
- Chord Timeline
- Melody / Bass Contour
- Rhythm Density / Energy Curve
- Section Map
- Note / Velocity Heatmap
- Visual Tab
- Visualization model unit test 2件

設計方針:
- 既存Analyzerの候補順位を変更しない
- VisualizationはNormalized SongとAnalyzer結果の表示Layerに限定する
- Energyはaudio loudnessではなくMIDI onset密度 × average velocityの簡易指標
- HeatmapはAndroid負荷を考慮して先頭16小節へ制限する

復元ポイント:
- `chatgpt/v0.4.1-feature-complete-milestone`
- `chatgpt/v0.5-feature-complete-milestone`

## v0.4.1-dev — 2026-10-13
状態: カテゴリ別Tab UI実装完了 / Unit Test・Production Build確認済み

主な内容:
- 解析結果を「概要 / Harmony / Melody / Bass / Rhythm / Structure / Compare / Library / AI / Parts」に分割
- 概要へ基本情報 / Playback / Track一覧 / Piano Rollを集約
- HarmonyへKey / Chord / Degree / Chord Detailを集約
- Melodyへ主旋律基本分析 + 裏メロ候補を集約
- Bassへ基本分析 + 詳細分析を集約
- Rhythmへ基本分析 + Drum詳細を集約
- StructureへMotif / Section / 区間Key / 転調候補を集約
- Compare / Library / Partsを専用Tab化
- AI Tabは将来機能用の準備中表示とし、v0.4.1ではAI解析を自動実行しない
- Android向け横スクロールTab列
- WAI-ARIA tablist / tab / tabpanel + Arrow / Home / End操作
- Tab navigation unit test 3件

設計方針:
- Analyzerロジック・候補順位・Normalized Songは変更しない
- 既存UI componentをカテゴリ別にmountできるよう分割し、解析結果の意味を維持する
- Import前の保存済みMIDI一覧は従来表示、Import後はLibrary Tabへ表示する

復元ポイント:
- `chatgpt/v0.4-before-tabbed-ui`
- `chatgpt/v0.4.1-feature-complete-milestone`

## v0.4-dev — 2026-10-13
状態: Part Deep Analysis最小Scope実装完了 / 76 tests pass / Production Build確認済み / GitHub Pages公開済み

主な内容:
- 裏メロ候補: 反行 / 並行 / 斜行 / 隙間 / 2度衝突候補 / Register
- Bass詳細: ペダル / オクターブ / 半音 / 順次 / 次Chord Root接近
- Drum詳細: GM Drum Map大分類 / 使用Note / Fill候補
- Track役割候補: Melody / Chord / Bass / Drums / Other
- Android-first Part Deep Analysis Panel
- Part Deep unit test 5件
- v0.1〜v0.3を含む全76 tests pass

設計方針:
- 解析結果は候補であり、良し悪しや役割を自動確定しない
- v0.1/v0.2/v0.3のAnalyzer結果を破壊的変更しない
- Normalized Songを入力の正本として維持する

復元ポイント:
- `chatgpt/v0.4-before-part-deep`
- `chatgpt/v0.4-feature-complete-milestone`
- `chatgpt/v0.4-published-milestone`

## v0.3-dev — 2026-10-13
状態: Compare / Personal Trend最小Scope実装完了 / CI・Production Build確認済み

主な内容:
- 参考曲MIDI vs 現在のMIDIの2曲比較
- Key / BPM / Chord / Melody / Bass / Rhythm / 音域 / 密度 / 転調候補数を同一指標で比較
- Top 1コード集合の共通度表示
- IndexedDB保存済みMIDIからPersonal Trend集計
- 保存 / 削除後のTrend再集計
- Compare unit test 5件

設計方針:
- 比較値を優劣評価へ変換しない
- 比較用MIDIは一時解析のみで自動保存しない
- 既存Analyzerを再利用し、Compare機能からKey / Chord順位を変更しない
- Personal Trendはユーザーが明示保存したSongだけを集計する

復元ポイント:
- `chatgpt/v0.3-before-compare`
- `chatgpt/v0.3-feature-complete-milestone`

## v0.2.1-dev — 2026-10-13
状態: Top 1コード進行表示追加 / CI・Production Build確認済み / GitHub Pages公開済み

主な内容:
- 各Chord表示区間のランキング1位を時間順に抽出
- Top 1コード進行を小節番号 / Chord名 / 一致度つきで横並び表示
- Chord分析Track変更時にTop 1コード進行を自動再計算
- 手動Chord選択とは独立した自動候補表示として維持
- Top 1 progression helper unit test 2件追加
- `VERSION` / `package.json` / 画面title / headerのVersion表示を`v0.2.1-dev`へ同期

設計方針:
- 既存Chordランキングの計算ロジックは変更しない
- Top 1コード進行は各segmentの`candidates[0]`だけを時系列で表示する
- Top 3候補とユーザー手動選択UIは従来どおり残す

復元ポイント:
- `chatgpt/v0.2-before-top1-progression`
- `chatgpt/v0.2.1-published-milestone`

## v0.2-dev — 2026-10-13
状態: v0.2最小Scope実装完了 / 実MIDI安定化待ち

主な内容:
- 移調非依存Motif反復候補
- 4小節BlockのSection候補
- 4小節BlockごとのKey Timeline
- 転調候補 + Key relation
- 転回形 / Slash Chord候補
- add9 / 11 / 6・13色付け候補
- Android-first発展分析Panel
- Motif / Structure / Harmony Detailの追加自動テスト
- 全部入りを段階追加するROADMAPへ更新

設計方針:
- v0.1 Chord Analyzerの順位・選択形式を破壊しない
- v0.2 Chord Detailは上位Layerとして追加する
- Motif / Section / 転調も自動確定せず候補表示する
- Normalized Songを解析入力の正本として維持する

復元ポイント:
- `chatgpt/v0.2-before-structure-motif`

## v0.1-dev — 2026-10-12〜2026-10-13
状態: v0.1機能Scope実装完了 / Android基本Smoke Test完了 / 実MIDI安定化待ち

主な内容:
- MIDI Import / Normalized Song Schema
- IndexedDB端末保存（任意）
- 読み取り専用Piano Roll
- Key / Scale候補 Top 3 + ユーザー選択
- Chord候補 Top 3 + Track選択 + Degree表示
- Melody基本分析（音域 / 跳躍 / 同音連打 / 密度 / Chord Tone）
- Bass基本分析（最低音移動 / Root・3rd・5th・Other / リズム型）
- Rhythm基本分析（拍位置 / シンコペーション候補 / 密度 / 16分Grid）
- Chord選択 / Chord Track変更とBasic Analysis再計算の連動
- 最小Play / Stop簡易再生
- Tempo Map対応Web Audio playback / Channel 10 click
- 再Import時の旧再生停止 / AudioContext lifecycle対策
- Parser / Normalizer / Storage / Piano Roll / Key / Chord / Basic Analysis / Playback自動テスト
- GitHub Actionsでtest + production buildを継続確認
- GitHub Pages公開
- Android Chrome基本実機確認

v0.1由来の継続確認:
- RipX / Scaler / EZkeys等の実MIDI regression
- Key / Chord係数・Basic Analysis heuristic調整
- Playback音量 / Tempo Change / Bluetooth確認

復元ポイント:
- `chatgpt/v0.1-before-midi-import`
- `chatgpt/v0.1-before-indexeddb`
- `chatgpt/v0.1-before-piano-roll`
- `chatgpt/v0.1-before-key-analyzer`
- `chatgpt/v0.1-before-chord-analyzer`
- `chatgpt/v0.1-before-basic-analysis`
- `chatgpt/v0.1-before-playback`
- `chatgpt/v0.1-feature-complete-milestone`
- `chatgpt/v0.1-android-verified-milestone`

最新安定版:
未作成
