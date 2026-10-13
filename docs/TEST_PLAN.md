# TEST_PLAN.md

## 自動テスト範囲

### 基礎Regression
- Parser / Normalizer / Storage / Piano Roll
- Key / Chord / Degree / Top 1 Chord Progression
- Melody / Bass / Rhythm Basic Analysis
- Playback Schedule / Controller
- Motif / Structure / Modulation / Harmony Detail
- Compare / Personal Trend
- Part Deep Analysis
- Visualization
- Clip Library
- Part Recorder / IndexedDB v3 migration

### Tab UI
Tab順:
`overview → harmony → melody → bass → rhythm → structure → visual → compare → library → recorder → export → ai → metrics → parts`

- ArrowLeft / ArrowRight循環
- Home / End

### v0.7 Integration / Export
1. Analysis Bundleが既存Analyzerを統合し、元Songを変更しない
2. Demo Composer AdapterがSchema 3を返す
3. Demo Composer basic.ppq=480 / timeSignature=4/4
4. Key表記をDemo ComposerのC/C#/D/D#/...へ変換する
5. Chord quality / degree / tickを互換形式へ変換する
6. Melody / Counter / Bass / Drums Trackを互換形式へ変換する
7. JSON Exportがparse可能
8. CSVにKey / Chord / Section / Modulation行がある
9. MarkdownにMetrics / 学べることを含められる
10. Chord / Degree Textを生成できる
11. `node --check bridge/server.mjs`でBridge構文を確認する

### v0.8 Explainability
1. `generatedLocally=true`
2. Key / Chord / 転調説明が生成される
3. 学べることが複数生成される
4. 作曲への応用候補が複数生成される
5. 外部AI用PromptにKey / Chord / Metrics / 不確実性指示を含む
6. 外部Network通信を必要としない

### v0.9 Higher-level Metrics
1. 6種類のMetricを返す
2. 全Scoreが整数0〜100
3. 各MetricにLabel / Summary / Evidenceがある
4. Sectionがある場合chorusCandidatesを返す
5. サビらしさはSection間のdensity / velocity / register相対値で計算する
6. Score計算で元Song / Analyzer候補順位を変更しない

実行:
```bash
npm test
npm run build
```

`npm test`にはNode unit testsに加えてRipX Bridgeの`node --check`を含む。

## 実MIDIテスト候補
- RipX非Quantize / Scaler・EZkeys Quantize
- 3/4 / 6/8 / Tempo Change
- 主旋律 + 裏メロ別Track
- Bass approach / pedal / octave
- GM Drum / Fill
- 参考曲 / 自作曲比較
- 16小節超Visual
- 複数Clip保存
- v1 / v2保存データからv3 Upgrade
- Part録音
- Demo ComposerへExportしたproject.jsonの実Import
- v0.9 Scoreの曲種別比較

## Android Manual
- 全14 Tabを320px幅で横スクロール・切替
- Import / Storage / Play / Piano Roll / 各Analyzer
- Visual / Compare / Library / Recorder
- Export各形式Download
- Demo Composer project.jsonを共有 / 保存できる
- AI Tabが端末内Explainabilityと明示される
- MetricsのScore + Evidenceが読める
- RipX Bridgeを同一Wi-Fi PC→Androidで開きMIDI Downloadできる
- Recorder MediaRecorder / Audio書き出し

## Demo Composer Integration Manual
1. Analyzerから`project.json` Export
2. Demo ComposerのImportへ渡す
3. validation errorなし
4. BPM / Key / Chord / Melody / Bass / Counter / Drumsが開ける
5. 4/4以外 / PPQ480以外でWarning内容と変換結果を確認

## Regression
固定MIDIで既存結果を再解析し、意図しない変化がないか確認する。
UI / Export / Explainability / MetricsはNormalized Songと既存Analyzerを破壊しない。
IndexedDB version変更時は既存Store / record保持をmigration testで確認する。
アルゴリズム係数変更はCHANGELOGへ記録する。
