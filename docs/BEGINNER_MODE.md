# MIDI Archive/Analyzer 初心者モード

Version: v0.20-dev
更新日: 2026-10-15

## 目的

最初の画面から「何をすればよいか」を迷わず選べる入口を提供する。

初心者モードは2段階です。

1. **読み込み前の初心者スタート** — Archive / Analyzer の目的を選ぶ。
2. **読み込み後の初心者分析** — 既存Analyzerの結果を基本5項目＋音の役割へ要約する。

元MIDI、Normalized Song、候補順位、SongProject、IndexedDB Schemaは変更しない。

## 読み込み前の初心者スタート

初期表示では次の2択を最優先する。

1. **MIDIを保存・整理する**
   - 「この端末に保存する」をONにしてMIDI Importへ進む。
   - Archiveとして後からLibraryで確認できる。
2. **MIDIを解析する**
   - 端末保存はOFFのままMIDI Importへ進む。
   - 保存せず、その場で特徴だけ確認できる。

補助操作:
- 「保存済みMIDIを見る」
- 「詳細ツールを表示 / 隠す」

初心者スタートでは Audio→MIDI / Note Tools / Stem Reference の詳細ツールを初期状態で隠す。必要な場合だけ表示する。

開始画面の表示設定は `localStorage` の `midi-analyzer.start-mode.v1` に保存する。保存できない環境では初心者表示を初期値とする。

## 読み込み後の初心者分析

1. MIDIを読み込む。
2. 読み込み前の初心者スタートは隠れる。
3. 初心者モードが最初に表示される。
4. Key / 音域 / 音の動き / リズム / 反復の基本5項目を確認する。
5. v0.20ではChord Tone / Scale Toneを分けた「音の役割」を追加で確認する。
6. 各Metricを `Metric → Meaning → Action` の順に読む。
7. Actionは最大数件の任意案として扱い、実行しない / 保留も正式な選択肢とする。
8. 必要な場合だけ「詳細モード」へ切り替え、従来の解析タブを使う。

解析表示モードは `localStorage` の `midi-analyzer.analysis-mode.v1` に端末内保存する。保存できない環境では初心者モードを初期値として動作する。

## 要約ルール

- Key: 既存Key Analyzerの第1候補を表示する。確率や正解とは扱わない。
- 音域: 7半音以下を「せまめ」、8〜16半音を「ちょうど」、17半音以上を「広め」の目安として表示する。
- 音の動き: Melody Analyzerの平均跳躍を「なめらか / ほどよく動く / ジャンプが多め」に言い換える。
- リズム: 拍頭以外の発音比率から「まっすぐ / ほどよく変化 / 細かく動く」を表示する。
- 反復: 既存Motif Analyzerの4音Motif候補を使い、反復傾向を説明する。
- 音の役割: Chord Tone率とScale Tone率を別々に表示し、「Chord外・Scale内」「Chord内・Scale外」「両方の外側」がある場合は意味を短く説明する。

これらは作曲品質・人気・正解を採点する指標ではない。Actionも「変更すべき命令」ではなく、元案と比較するための試行候補として表示する。

## Chord Tone / Scale Tone

- Chord Tone: その瞬間のChord構成音との関係。
- Scale Tone: 現在のKey / Scale候補との関係。
- Non-Chord ToneとNon-Scale Toneは同義ではない。
- 外音を誤りと判定しない。
- Chord未選択時は第1Chord候補、Key未選択時は第1Key候補を仮使用し、その前提を表示する。

詳細: `docs/NOTE_FUNCTION_ANALYSIS.md`

## プライバシー

初心者モードの分析は端末内で完結する。MIDI、音声、解析結果を外部AIや外部サービスへ自動送信しない。

## 回帰条件

- 初期状態でArchive / Analyzeの2択が表示される。
- Archive選択では端末保存がONになる。
- Analyze選択では端末保存を必須にしない。
- 詳細ツールを表示 / 隠すできる。
- 読み込み後は基本5項目＋音の役割が表示される。
- Key候補選択で音の役割が再計算される。
- Chord候補選択 / Chord分析Track変更で音の役割が再計算される。
- Melody Track変更で音の役割が再計算される。
- 既存解析タブを削除しない。
- 初心者モードから詳細モードへ切り替えて全タブを使用できる。
- 詳細モードから初心者モードへ戻せる。
- 360 / 390 / 430pxで横スクロールを発生させない。
- SongProject / MIDI保存 / Export / Key変更 / Library導線を維持する。
- Console errorを発生させない。
