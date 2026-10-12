# DEMO_COMPOSER_INTEGRATION.md

## 方針
MIDI AnalyzerとDemo Composerは別アプリ。

Demo Composerの `project.json` Schemaへ直接依存しない。

将来:

MIDI Analyzer
↓ Export Adapter
小さな交換JSON
↓ Import Adapter
Demo Composer

## 渡す候補
- BPM
- Key
- Scale
- Chord
- Melody
- Bass
- Rhythm

原則として人が `selected` 済みの値を中心にExportする。

## Version
Export Adapterはv0.3以降。
