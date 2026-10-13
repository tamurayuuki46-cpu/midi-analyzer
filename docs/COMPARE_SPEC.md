# COMPARE_SPEC.md

## Version
v0.3-dev

## 目的
2つのNormalized Songを同じ指標で比較し、参考曲と自作曲の共通点・差分を作曲判断の材料として表示する。差を優劣として評価しない。

## 2 MIDI比較
現在読み込んでいるMIDIを「自作曲」側、比較用に追加選択したMIDIを「参考曲」側として扱う。比較用MIDIは自動保存しない。

比較項目:
- Top Key / BPM
- Chordランキング1位の進行と使用Chord共通度
- Melody音域 / 密度 / 平均跳躍
- Bass平均移動量 / Root一致率
- Rhythm発音密度 / 拍頭率
- 全体Note密度
- 転調候補数

各数値は既存Analyzerを再利用して算出し、Compare専用の別判定で既存Key/Chord順位を変更しない。

## Chord共通度
両曲のTop 1コード進行に登場するChord名を重複除去し、集合の共通度をJaccard型で表示する。

`共通Chord数 / 両曲を合わせたユニークChord数`

同じ進行順序であることを意味する指標ではない。

## Personal Trend
IndexedDBへユーザーが明示的に保存したNormalized Songだけを集計対象とする。

集計項目:
- よく使うKey
- 平均BPM
- 平均Melody音域 / 密度
- 平均Bass移動量
- 平均Rhythm密度
- 平均Note密度
- 平均転調候補数
- よく出るChord

保存・削除後は再集計する。保存OFFのMIDIを勝手に傾向DBへ残さない。

## 表示方針
- Android-first
- 参考 / 自作を並べる
- 比率差はpercentage pointで表示
- 「似ている」「違う」を良し悪しに変換しない
- 比較用MIDIはクラウド送信しない

## v0.3でしない
- Track同士の手動対応付け
- Section単位の2曲同期比較
- DTW等によるフレーズ時間伸縮比較
- 類似曲検索
- AI文章評価
- 比較結果のクラウド保存
