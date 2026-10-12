# MIDI Analyzer

Androidスマートフォン中心の作曲支援PWA。MIDIを読み込み、Key / Chord / Melody / Bass / Rhythm / Motif / Section / 転調 / 比較 / パート詳細を可視化し、作曲判断へ応用するためのアプリです。

## 現在Version
`v0.4-dev`

公開中Version: `v0.2.1-dev`

公開先: `https://tamurayuuki46-cpu.github.io/midi-analyzer/`

`develop`への統合時にUnit Test → Production Build → GitHub Pages Deployを自動実行します。`main`は安定版専用です。

## 実装済み
- `.mid` / `.midi` Import / `midi-file` Adapter / Normalized Song
- Tempo / 拍子 / Track一覧 / RipX origin / Warning
- IndexedDB任意保存 / 一覧 / 削除
- 読み取り専用Piano Roll
- Key / Scale Top 3 + ユーザー選択
- Chord Top 3 + Track選択 + Degree
- 各Chord区間ランキング1位の仮コード進行
- Melody / Bass / Rhythm基本分析
- Play / Stop簡易再生
- Motif反復 / 4小節Section / 区間Key / 転調候補
- Slash Chord / add9・11・6/13色付け候補
- 2 MIDI比較 / 参考曲 vs 自作曲
- 保存済みMIDIからPersonal Trend集計
- 裏メロ候補の反行 / 並行 / 斜行 / 隙間 / 2度衝突候補
- Bass詳細: ペダル / オクターブ / 半音 / 順次 / 次Chord Root接近
- Drum詳細: GM Drum分類 / 使用Note / Fill候補
- MIDI Track役割候補
- GitHub Actions CI / GitHub Pages

## v0.3 Compare / Personal Trend
現在のMIDIを自作曲側、追加で選んだMIDIを参考曲側として同じ指標で比較します。Key / BPM / Chord / Melody / Bass / Rhythm / Note密度 / 転調候補数を並べます。差は優劣として評価しません。

比較用MIDIは自動保存しません。Personal Trendはユーザーが明示的にIndexedDBへ保存したMIDIのみから、よく使うKey / Chordや平均BPM、Melody音域・密度などを集計します。

詳細: `docs/COMPARE_SPEC.md`

## v0.4 Part Deep Analysis
裏メロ候補、Bass、Drum、Track役割候補をより細かく分析します。裏メロの2度同時発音やDrum Fill等は「候補」として表示し、良し悪しを自動判定しません。

詳細: `docs/PART_DEEP_ANALYSIS_SPEC.md`

## 既存分析仕様
- Key / Scale: `docs/KEY_ANALYZER_SPEC.md`
- Chord / Degree: `docs/CHORD_ANALYZER_SPEC.md`
- Melody / Bass / Rhythm: `docs/BASIC_ANALYSIS_SPEC.md`
- Motif / Structure / Harmony Detail: `docs/ADVANCED_ANALYSIS_SPEC.md`
- Playback: `docs/PLAYBACK_SPEC.md`
- Storage: `docs/STORAGE_SPEC.md`
- Compare: `docs/COMPARE_SPEC.md`
- Part Deep: `docs/PART_DEEP_ANALYSIS_SPEC.md`

## 保存方針
「この端末に保存する」は初期OFFです。ONの場合のみ元MIDIと正規化結果を端末内IndexedDBへ保存します。クラウドへ自動送信しません。

## 開発
```bash
npm install
npm run dev
npm test
npm run build
```

plain HTML/CSS/JavaScript + Vite。React等のFrameworkは導入していません。

## Version Scope
- v0.1: Import / Storage / Piano Roll / Key / Chord / Melody / Bass / Rhythm / Playback
- v0.2: Motif / Section / 区間Key / 転調 / Chord Detail
- v0.2.1: Chordランキング1位の仮コード進行
- v0.3: 2 MIDI比較 / Personal Trend
- v0.4: 裏メロ / Bass / Drum / Track役割の詳細分析
- v0.5以降: Visualization → Library → Integration / Export → Explanation → Higher-level Metrics → v1.0統合

詳細は `docs/ROADMAP.md`。

## 開発開始時に読む順番
1. `README.md`
2. `VERSION`
3. `docs/AI_HANDOFF.md`
4. `docs/PRODUCT_SPEC.md`
5. `docs/ANALYSIS_SPEC.md`
6. `docs/COMPARE_SPEC.md`
7. `docs/PART_DEEP_ANALYSIS_SPEC.md`
8. `docs/MIDI_SCHEMA.md`
9. `docs/ARCHITECTURE.md`
10. `docs/ROADMAP.md`
11. `CHANGELOG.md`

重要仕様は `docs/` を正本とします。
