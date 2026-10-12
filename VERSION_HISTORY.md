# VERSION_HISTORY

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

## v0.2.1-dev — 2026-10-13
状態: Top 1コード進行表示追加 / CI・Production Build確認済み / GitHub Pages公開済み

主な内容:
- 各Chord表示区間のランキング1位を時間順に抽出
- Top 1コード進行を小節番号 / Chord名 / 一致度つきで横並び表示
- Chord分析Track変更時にTop 1コード進行を自動再計算
- 手動Chord選択とは独立した自動候補表示として維持

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
- Melody / Bass / Rhythm基本分析
- 最小Play / Stop簡易再生
- GitHub Actions test + production build
- GitHub Pages公開
- Android Chrome基本実機確認

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
