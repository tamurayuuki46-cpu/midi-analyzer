# MIDI Analyzer Role Boundary

更新日: 2026-10-13

## 一言定義

MIDI Analyzerの役割は次の2つだけ。

1. 素材を集める
2. 曲を理解する

MIDI Analyzerは作曲アプリでも編曲アプリでもない。

## 正式Workflow

作曲シート
→ 必要なら Moises → MIDI Analyzer
→ Demo Composer
→ Arrangement Lab
→ 必要なら Cubasis
→ PC DAW（必須）

MoisesはStem分離の主入口。AnalyzerはMoises等で得たStem / Audio / MIDIを受け取り、素材化・分析する。

## 1. 素材を集める

残す機能:
- MIDI Import / 保存
- Audio Import
- Moises等で分離したStemのImport / 保存 / Solo / Mute
- Audio→MIDI
- Basic Pitch抽出Noteの最小限の修正 / Quantize
- Chord / Melody / Bass / Drum / Motif Clip Library
- Tag / Search
- Key adaptation
- Degree Preserve
- 12 Key material生成
- RipX Bridge / PC→Android素材受け入れ
- JSON / CSV / Markdown / Chord-Degree等の素材・分析Export

ここで許可する編集は「素材を使える状態へ整える」ための非破壊・最小編集に限る。
曲を完成させるための作曲編集には踏み込まない。

## 2. 曲を理解する

残す機能:
- Key / Scale
- Chord / Degree / Chord Detail
- Melody / Bass / Rhythm分析
- Motif
- Section
- 転調候補
- 裏メロ分析
- Track役割
- Visualization
- Energy Curve / Heatmap / Section Map
- 2曲比較
- 参考曲 vs 自作曲
- Personal Trend
- Explainability / 「この曲から学べること」
- Higher-level Metrics + Evidence

Scoreは品質判定ではなく理解のための候補値とする。

## 他アプリへ移す仕事

### Demo Composerへ
- 自分の曲のChord / Melody / Bass / Drum / Counter作成
- 作曲案A/B
- 作曲Projectの所有

### Arrangement Labへ
- Reharmonization
- Voicing
- 編曲裏メロ
- 密度・展開・楽器参加
- 編曲案A/B/C
- 採用判断履歴

### PC DAWへ
- 本格音色
- 詳細MIDI編集
- Audio/Vocal Recording
- Automation
- Mixing / Mastering
- 完成音源

## 削除 / 縮小方針

### Part Recorder

主UIから削除する。

理由:
- Analyzer内部の簡易SynthをAudio録音する機能で、素材収集にも曲理解にも中核ではない
- Moises→Analyzer→Demo ComposerというWorkflowを分断する
- Preview / MIDI Export / DAW側のAudio化と役割が重なる

既存`savedTakes`データは破壊しない。IndexedDB storeとmigrationは当面残し、互換性を維持する。

### Stem分離

AnalyzerをStem分離サービス化しない。
Moisesを主入口とし、AnalyzerはStemの受け入れ・管理・Audio→MIDIを担当する。

### Demo Composer Project Export

Analyzerが参考曲を丸ごと「自分の作曲Project」に変換する導線にはしない。
今後はsource typeを明確にし、参考曲はAnalysis / Reference / Clipとして渡す。自作MIDIなど明示された素材のみComposition変換を許可する方向へ整理する。

## UI原則

トップレベルの意味を2つにする。

- 素材を集める
- 曲を理解する

細かいTabはこの2群の下位機能として扱う。
ユーザーが「次に何をすればよいか」迷わないことを、機能数より優先する。

## 変更前復元点

`restore/before-workflow-boundary-2026-10-13`
