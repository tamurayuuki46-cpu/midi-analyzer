# CHANGELOG v0.19-dev

Version: v0.19-dev
更新日: 2026-10-15

【追加】
- 初心者モードへ `Metric → Meaning → Action` 表示を追加。
- Key / 音域 / 音の動き / リズム / 反復の各Metricに、採点ではない特徴説明（Meaning）と任意の実験案（Action）を追加。
- 参考曲の分析を具体的Note列 / Chord列のコピーへつなげず、音域・旋律の動き・発音位置・反復などの抽象特徴として扱う `Reference Insight` を追加。
- `Reference Insight → この特徴を自分の曲で試す` の導線を初心者モードへ追加。

【変更】
- 初心者モードの主要導線を「良いところ / 改善するとよいところ」中心から、特徴を理解して任意に試す構造へ変更。
- Actionは最大3件程度を主表示し、実行しない・今の特徴を維持する・保留することも正規の選択肢として扱う。
- Analyzerは正解判定機ではなく、素材を集める・曲を理解するOwnerとして維持。

【修正】
- 音域・跳躍・拍頭外発音などが、文脈なしに良い / 悪いへ読める表現を主要初心者UIから除去。

【互換性】
- SongProject v1のSchema変更なし。
- IndexedDB v3、既存MIDI / Clip / Stem / Takeを変更しない。
- 既存詳細13タブと詳細モードを維持。
- 既存の`positives` / `improvements`戻り値は互換用aliasとして残すが、内容は中立表現とする。

【復元ポイント】
- `restore/develop-before-metric-meaning-action-v0.19-20261015`

【未対応】
- Android実機でのタップ操作・PWA再起動後の表示保持確認。
- 実MIDIによるMeaning / Action文言の追加チューニング。
- 統合後Adversarial Review。
- stable tag（実機確認後のみ）。
