# VERSION_HISTORY

## v0.4-dev — 2026-10-13
状態: Part Deep Analysis最小Scope実装 / 自動テスト中

主な内容:
- 裏メロ候補: 反行 / 並行 / 斜行 / 隙間 / 2度衝突候補 / Register
- Bass詳細: ペダル / オクターブ / 半音 / 順次 / 次Chord Root接近
- Drum詳細: GM Drum Map大分類 / 使用Note / Fill候補
- Track役割候補: Melody / Chord / Bass / Drums / Other
- Android-first Part Deep Analysis Panel
- Part Deep unit test 5件

設計方針:
- 解析結果は候補であり、良し悪しや役割を自動確定しない
- v0.1/v0.2/v0.3のAnalyzer結果を破壊的変更しない
- Normalized Songを入力の正本として維持する

復元ポイント:
- `chatgpt/v0.4-before-part-deep`

## v0.3-dev — 2026-10-13
状態: Compare / Personal Trend最小Scope実装完了 / CI・Production Build確認済み

主な内容:
- 参考曲MIDI vs 現在のMIDIの2曲比較
- Key / BPM / Chord / Melody / Bass / Rhythm / 音域 / 密度 / 転調候補数比較
- IndexedDB保存済みMIDIからPersonal Trend集計
- Compare unit test 5件

復元ポイント:
- `chatgpt/v0.3-before-compare`
- `chatgpt/v0.3-feature-complete-milestone`

## v0.2.1-dev — 2026-10-13
状態: Top 1コード進行表示追加 / GitHub Pages公開済み

主な内容:
- 各Chord区間のランキング1位を時間順に表示
- Track変更時に再計算 / 手動選択とは別管理

復元ポイント:
- `chatgpt/v0.2-before-top1-progression`
- `chatgpt/v0.2.1-published-milestone`

## v0.2-dev — 2026-10-13
状態: Structure / Motif最小Scope実装完了

主な内容:
- Motif / Section / 区間Key / 転調候補
- Slash Chord / Chord Detail

復元ポイント:
- `chatgpt/v0.2-before-structure-motif`

## v0.1-dev — 2026-10-12〜2026-10-13
状態: 基礎Scope実装完了 / Android基本Smoke Test完了

主な内容:
- MIDI Import / IndexedDB / Piano Roll
- Key / Chord / Degree / Melody / Bass / Rhythm
- Play / Stop / GitHub Pages

復元ポイント:
- `chatgpt/v0.1-feature-complete-milestone`
- `chatgpt/v0.1-android-verified-milestone`

最新安定版:
未作成
