# MIDI Analyzer

Androidスマートフォン中心の作曲支援PWA。

MIDIファイルを分析し、Key / Scale、Chord、Degree、Melody、Bass、Rhythm、Chord Tone / Non-Chord Tone などを見える化して、「なぜこう聞こえるのか」を理解して自分の作曲へ応用するためのアプリです。

## 現在Version
`v0.1-dev`

最新安定版: 未作成

## 位置づけ
音源 → RipX → MIDI Analyzer → Demo Composer → Cubasis → Cubase → 完成曲

## 現在実装済み
- `.mid` / `.midi` Import UI
- `midi-file` Parser Adapter / Song正規化
- Tempo Map / Time Signature / Track情報
- RipX origin / Warning処理
- IndexedDB端末保存（初期OFF）/ 一覧 / 削除
- 読み取り専用Piano Roll
- 固定binary MIDI Parser regression fixture
- Key / Scale Analyzer（major / minor 上位3候補）
- Key候補のユーザー選択UI
- Parser / Normalizer / Storage / Piano Roll / Key Analyzer tests

## Key / Scale
Drums以外のNoteを `durationTick × velocity` で重み付けし、major/minor 24候補から上位3つを表示します。
一致度は確率ではなくKey profileとの類似度です。解析直後に自動確定せず、ユーザーが選んだときだけ選択状態にします。

詳細: `docs/KEY_ANALYZER_SPEC.md`

## 保存方針
「この端末に保存する」は初期状態でOFFです。ONの場合のみ元MIDIと正規化結果を端末内IndexedDBへ保存します。クラウドへの自動送信はありません。

## 開発
```bash
npm install
npm run dev
npm test
npm run build
```

Viteはplain HTML/CSS/JavaScriptとnpm依存をbundleするためだけに使用し、React等のFrameworkは導入していません。

## v0.1 Scope
入れる:
- MIDI Import / 保存選択 / Track一覧
- 読み取り専用Piano Roll
- Key / Scale候補
- Chord分析 + Degree
- Melody / Bass / Rhythm 基本分析
- 最小簡易再生（Play / Stop）

入れない:
- 音声→音符 / Stem分離 / MIDI編集
- MIDI内パート分離 / Motif / MIDI比較
- Demo Composer Export Adapter / RipX Bridge

## 開発開始時に読む順番
1. `README.md`
2. `VERSION`
3. `docs/AI_HANDOFF.md`
4. `docs/PRODUCT_SPEC.md`
5. `docs/ANALYSIS_SPEC.md`
6. `docs/MIDI_SCHEMA.md`
7. `docs/ARCHITECTURE.md`
8. `CHANGELOG.md`

重要仕様は `docs/` を正本とします。
