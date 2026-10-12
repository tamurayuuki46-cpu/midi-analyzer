# MIDI Analyzer

Androidスマートフォン中心の作曲支援PWA。

MIDIファイルを分析し、Key / Scale、Chord、Degree、Melody、Bass、Rhythm、
Chord Tone / Non-Chord Tone などを見える化して、
「なぜこう聞こえるのか」を理解し、自分の作曲へ応用するためのアプリです。

## 現在Version

`v0.1-dev`

最新安定版: 未作成

## 位置づけ

音源 → RipX → MIDI Analyzer → Demo Composer → Cubasis → Cubase → 完成曲

- RipX: 音源解析 / Stem分離 / Note抽出
- MIDI Analyzer: MIDI理論分析 / 可視化 / 比較 / 学習
- Demo Composer: 作曲
- Cubasis: モバイル制作
- Cubase: 本制作

## v0.1 Scope

入れる:
- MIDI Import
- 保存する / しない選択
- Track一覧
- 読み取り専用Piano Roll
- Key / Scale候補
- Chord分析 + Degree
- Melody / Bass / Rhythm 基本分析
- 最小の簡易再生（Play / Stop）

入れない:
- 音声→音符
- Stem分離
- MIDI編集
- MIDI内パート分離
- Motif
- MIDI比較
- Demo Composer Export Adapter
- RipX Bridge

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
