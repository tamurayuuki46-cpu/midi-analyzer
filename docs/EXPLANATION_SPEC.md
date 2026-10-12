# EXPLANATION_SPEC.md

## Version
v0.9-dev（v0.8 Explanation scope）

## 目的
既存Analyzerの候補値を、作曲学習で読める文章へ変換する。
外部AIへ自動送信せず、根拠と不確実性を残したExplainabilityを提供する。

## 原則
- Key / Chord / Section / 転調を断定しない
- confidenceを確率として扱わない
- 「良い / 悪い」評価をしない
- 元MIDI / Song / Analyzer順位を変更しない
- 説明は既存解析結果から決定論的に生成する

## AI Tab
表示項目:
1. 概要
2. なぜこのKey候補か
3. Chord進行の読み方
4. 転調候補の読み方
5. この曲から学べること
6. 作曲へ応用する候補
7. 外部AI用Prompt Export

## Key説明
Top候補と第2候補がある場合の一致度差を表示する。
一致度はPitch Class分布との適合指標であり、確率ではないことを明記する。

## Chord説明
各Chord区間のTop 1候補を時系列表示し、使用Chord種類数などを説明する。
Top 1は仮候補で、耳で確認して採用する前提を明記する。

## 転調説明
4小節BlockのKey Timelineから得た転調候補を表示する。
relation:
- parallel
- relative
- dominant
- subdominant
- semitone
- whole-tone
- other

局所的借用和音や短時間のtonicizationを完全判定するものではない。

## 「この曲から学べること」
候補生成源:
- Key候補
- Top 1 Chord progression
- Motif反復
- Section反復 / 対比
- 転調候補
- Counter Melody motion / gap use
- サビらしさSection候補

最大7項目程度に絞り、観察可能な根拠を文章化する。

## 作曲への応用候補
Higher-level Metricsを使い、次のようなA/B可能な提案へ変換する。
- Floating: color chord / non-chord toneを1要素ずつ試す
- Surprise: 変化点前後のContrastを設計する
- Repetition: Motifの移調 / rhythm末尾 / registerを1要素だけ変える
- Counter: 主旋律休符を埋めるSparse案と反行案を比較する
- Density: Partを1つMute / 1Layer追加した案を比較する

完成案を自動生成・採用せず、ユーザーが比較できる候補にする。

## 外部AI Prompt
`buildAiPrompt` は解析候補をText fileへまとめる。
ユーザーが明示保存し、必要ならChatGPT等へ手動で渡す。

Prompt内容:
- Source
- Key candidate
- Chord candidates
- Modulation candidates
- Higher-level Metrics
- 断定しない / 不確実性を示す指示
- 学べること / 5軸への応用 / 注意点を求める指示

## Privacy
- API通信なし
- API Key不要
- MIDI / Analysisを外部へ自動送信しない
- Prompt fileもユーザー操作時だけ生成する

## UI表現
`端末内Explainability` と表示し、外部生成AIが自動実行されているように見せない。

## Scope外
- v1.0のAI Provider統合
- Online RAG / Web検索
- Audio timbre / 歌詞内容の説明
- アーティスト本人の作曲意図の断定
