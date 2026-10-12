# PART_DEEP_ANALYSIS_SPEC.md

## Version
v0.4-dev

## 目的
Normalized Song内の各パートを、v0.1の基本分析より細かく観察する。結果はすべて作曲判断用の候補・特徴量であり、自動確定や良し悪し評価をしない。

## 裏メロ候補
主旋律Trackと別の単音寄り非Drum Trackを比較する。roleHint=melodyを優先し、Bass/Chord候補や強い多声音Trackは候補順位を下げる。

8分音符Gridを基本に以下を表示する。
- 反行: 両パートが逆方向へ動く
- 並行: 両パートが同方向へ動く
- 斜行: 一方が保持し他方が動く
- 主旋律の隙間を裏メロが鳴らす比率
- 同時発音で短2度/長2度になる衝突候補
- 裏メロが主旋律より上/下にある比率

2度は「衝突候補」であり、不適切とは判定しない。

## Bass詳細
代表Bass onsetを同一tickの最低音として扱い、以下を表示する。
- 最頻Pitch Classによるペダル候補
- 12 semitoneのオクターブ移動
- 1 semitoneの半音進行
- 2 semitone以内の順次進行
- Chord切替直前のBassが次Chord Rootへ半音/全音で接近する候補

Chord情報には既存Chord Analyzerの第1候補を使用し、ランキング自体は変更しない。

## Drum詳細
Channel 10またはDrum TrackのNoteをGM Drum Mapの大分類へ分ける。
- Kick
- Snare
- Hi-Hat
- Tom
- Crash
- Ride
- Other

使用GM Note名と回数を表示する。

### Fill候補
小節単位で以下のどちらかを満たす場合に候補とする。
- Tomが2発以上
- 小節内onset数が平均の1.5倍以上かつ4以上

Fill確定ではなく、密度変化を見るための候補である。

## MIDI内パート役割候補
TrackごとにroleHint、Drum情報、平均Pitch、同時発音傾向から Melody / Chord / Bass / Drums / Other候補を表示する。

roleHintが既にある場合は優先する。roleHintがない場合のみ特徴量で推定する。自動でTrack metadataを書き換えない。

## v0.4でしない
- 音源分離
- MIDI Noteの自動編集
- 裏メロの良否判定
- Voice Leadingの完全な和声学判定
- Drum Fillの機械学習分類
- Instrument Program Changeによる厳密な役割確定
