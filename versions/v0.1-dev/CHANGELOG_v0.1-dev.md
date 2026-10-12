# CHANGELOG

## Version: v0.1-dev
更新日: 2026-10-12

### 【追加】
- MIDI Analyzer 初期Repository構成を作成
- 共通仕様書を `docs/` に分割
- ChatGPT / Codex / Claude 共同開発ルールを定義
- v0.1 MIDI Schema初版を定義
- v0.1 Analysis仕様初版を定義
- Android UI方針を定義
- RipX / Demo Composer 将来連携境界を定義
- 分離処理の将来interfaceを定義

### 【変更】
- Motifをv0.1から外し、v0.2以降へ移動
- 6/8拍子で内部Gridと音楽的Beatを区別する方針に修正
- Trackは単一channel前提にせず `channels[]` を使用
- Drum除外はNoteのMIDI Channel 10（0-based index 9）を基本判定とする
- Chord分析対象Trackをユーザーが選択できる方針を追加
- v0.1 UIから一般Exportを外し、Import / 保存 / 削除を中心に整理

### 【修正】
- Claude引き継ぎ案と既存仕様の矛盾を整理

### 【未対応】
- MIDI Parser実装
- PWA UI実装
- Analyzer実装
- 実MIDIによる係数調整
