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
- `.mid` / `.midi` Import UIを追加
- `midi-file@1.2.4` Parser Adapterを追加
- Standard MIDI Fileから共通Song / Track / Noteへ正規化する処理を追加
- Tempo Map / Time Signature正規化を追加
- Note On velocity 0をNote Offとして処理
- 1 Track内複数Channelの保持を追加
- RipX由来MIDIのorigin記録を追加
- 不完全NoteイベントのWarning処理を追加
- Import結果のOverview / Track一覧UIを追加
- Normalizer unit test 7件を追加
- test / build用GitHub Actions CIを追加
- `docs/MIDI_IMPORT.md` を追加

### 【変更】
- Motifをv0.1から外し、v0.2以降へ移動
- 6/8拍子で内部Gridと音楽的Beatを区別する方針に修正
- Trackは単一channel前提にせず `channels[]` を使用
- Drum除外はNoteのMIDI Channel 10（0-based index 9）を基本判定とする
- Chord分析対象Trackをユーザーが選択できる方針を追加
- v0.1 UIから一般Exportを外し、Import / 保存 / 削除を中心に整理
- ViteをFrameworkではなくBuild Toolとして導入
- tempo / 拍子eventがないMIDIではStandard既定値をimplicit値として保持する方針を明文化

### 【修正】
- Claude引き継ぎ案と既存仕様の矛盾を整理

### 【未対応】
- IndexedDB保存
- 読み取り専用Piano Roll
- Key / Chord / Melody / Bass / Rhythm Analyzer
- binary MIDI fixtureを使ったParser integration test
- 実MIDIによる分析係数調整
