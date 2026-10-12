# ADVANCED_ANALYSIS_SPEC.md

対象Version: v0.2-dev

## 目的
v0.1のKey / Chord / Melody / Bass / Rhythmを壊さず、その上に作曲構造を理解するための候補分析を追加する。

v0.2でもAnalyzerは自動確定しない。Section / Motif / 転調 / Slash Chord / Tensionはすべて候補として扱う。

## Motif候補
- 初期TrackはMelody roleHintを優先し、なければ既存Melody fallbackを使う。
- 同一Tick複数NoteはMelody代表Noteへ集約する。
- 標準4NoteのスライディングWindowを作る。
- Signatureは連続音程差 + 1/4拍単位へ丸めたonset間隔。
- 絶対PitchをSignatureに入れないため、同じ形を移調した反復も同一Motif候補として扱う。
- 2回以上の非重複Occurrenceを候補表示する。
- v0.2では反転・augmentation/diminution・曖昧マッチは未対応。

## Section候補
- 4小節Blockを基本単位にする。
- Pitch Class分布、Note密度、平均Pitch、平均Velocityを特徴量にする。
- 既出BlockとのSimilarityが0.82以上なら同じSection label候補を付ける。
- A/B/C等のlabelは構造名の確定ではなく類似Block識別子。
- 拍子変更は既存Chord Windowの小節境界を利用する。

## 区間Key / 転調候補
- Sectionと同じ4小節Blockごとに既存Key Analyzerを再利用する。
- Block境界で第1Key候補が変わった場合に転調候補を作る。
- relationは同主調 / 平行調 / 属調方向 / 下属調方向 / 半音 / 全音 / その他を補助表示する。
- confidenceは各Block Key profile一致度の低い側を表示する。
- pivot chordやcommon toneによる転調理由推定は後続Versionで追加する。

## Chord Detail
既存Chord Analyzerの候補順位は変更しない。

第1Chord候補に対して、同区間の最低音と構成音を確認し以下を追加表示する。
- 転回形 / Slash Chord候補
- add9候補
- 11候補
- 6/13候補

最低音が既存Chord templateの構成音でRoot以外の場合のみSlash Chord候補にする。
Tension候補は区間weightの8%以上を持つPitch Classのみ表示する。

## UI
Import後の「発展分析」Panelに以下をまとめて表示する。
1. Motif候補
2. Section候補
3. 区間Key / 転調候補
4. Chord Detail

Android-firstを維持し、カードは狭い画面で1列、広い画面でSectionのみ2列までとする。

## v0.2非対象
- 2 MIDI比較
- 自作曲履歴の統計
- Demo Composer自動Export
- AI自然言語レポート
- 浮遊感 / 中毒性 / サビらしさ等の主観Score
- 音声解析

これらはROADMAPに従って段階追加する。
