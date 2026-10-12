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
- Standard MIDI File → Song / Track / Note正規化を追加
- Tempo Map / Time Signature正規化を追加
- Track一覧表示を追加
- Normalizer unit test 7件を追加
- GitHub Actions CI（test + build）を追加
- IndexedDB端末保存を追加（初期値OFF）
- 元MIDI bytes + 正規化Song保存を追加
- 保存済みMIDI一覧 / 削除を追加
- IndexedDB unit test 4件を追加
- `docs/STORAGE_SPEC.md` を追加
- 読み取り専用Piano Rollを追加
- Piano Roll Track切替 / 4段階Zoom / 横・縦Scrollを追加
- 小節線 / 拍線 / C音Pitch labelを追加
- Piano Roll model unit test 7件を追加
- `docs/PIANO_ROLL_SPEC.md` を追加

### 【変更】
- Motifをv0.1から外し、v0.2以降へ移動
- 6/8拍子で内部Gridと音楽的Beatを区別する方針に修正
- Trackは単一channel前提にせず `channels[]` を使用
- Drum除外はNoteのMIDI Channel 10（0-based index 9）を基本判定とする
- Chord分析対象Trackをユーザーが選択できる方針を追加
- v0.1 UIから一般Exportを外し、Import / 保存 / 削除を中心に整理
- 保存失敗とImport失敗を分離して扱う
- Piano Rollは複数Track同時表示ではなく、スマホ負荷を抑えるため1 Track表示を基本とする

### 【修正】
- Claude引き継ぎ案と既存仕様の矛盾を整理
- Track内に複数Channelがある場合のDrum表示を修正
- PWA manifest pathを相対path化

### 【未対応】
- 固定binary MIDI fixtureによるParser integration test
- Key / Scale Analyzer
- Chord Analyzer
- Melody / Bass / Rhythm Analyzer
- 最小簡易再生
- 実MIDIによる係数調整
