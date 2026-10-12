# PRODUCT_SPEC.md

## 製品名
MIDI Analyzer

## Version
v0.1-dev

## 目的
MIDIファイルから作曲上の特徴を見える化し、
「このMIDIがなぜこう聞こえるのか」を理解して、自分の作曲へ応用する。

DAWの代替ではない。

## 想定ユーザー
- Androidスマホ中心で作曲学習・分析をしたい人
- 音楽理論をMIDIと結びつけたい初心者〜中級者
- RipX / Cubase / Cubasis / Scaler / EZkeys / MIDI教材などを使う人

## 基本思想
特徴を測る
→ 見える化する
→ なぜそう聞こえるか考える
→ 自分の作曲へ応用する

## 評価しない
以下を理由に「良い / 悪い」を採点しない。
- Chord Tone率
- 跳躍量
- Non-Chord Tone量
- シンコペーション量
- 音数

## v0.1機能
- MIDI Import
- Track一覧
- 読み取り専用Piano Roll
- Key / Scale候補
- Chord候補
- Degree
- Melody基本分析
- Bass基本分析
- Rhythm基本分析
- 最小再生
- 端末保存の選択

## v0.1で作らないもの
- MIDI編集
- Audio→MIDI
- Stem分離
- MIDI内パート自動分離
- Motif
- 比較分析
- Demo Composer Export
- RipX Bridge
- Mixing / Mastering / Plugin Hosting
