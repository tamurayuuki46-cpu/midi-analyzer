# VERSION_HISTORY

## v0.1-dev — 2026-10-12
状態: v0.1機能Scope実装完了 / 実機・実MIDI安定化待ち

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
- Android-first UI / RipX・Demo Composer連携境界をdocsで管理

v0.1安定版化前の確認:
- Android Chrome実機でImport / Storage / Play / Stop / UI確認
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

最新安定版:
未作成
