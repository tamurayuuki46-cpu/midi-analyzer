# AI_HANDOFF

最終更新: 2026-10-15

## 現在地点

- current/develop: `v0.17-dev`
- `VERSION`: `v0.17-dev`
- `package.json`: `0.17.0-dev`
- main/public: `v0.17-dev`
- SongProject: `kind: "song-project"`, `schemaVersion: 1`
- stable tag: 未作成。Android実機 + 必要なCubasis/Cubase実機確認後のみ作成する。

`develop` = 開発統合、`main` = CI/build/回帰合格の公開候補 + GitHub Pages公開元。mainへ直接変更しない。

## 2026-10-15 安定化作業

2026-10-15時点で旧`develop`は`main`の祖先だったため、復元点を作成後に`main → develop`をfast-forwardして安全同期した。開発版をmainへ逆流させる操作は行っていない。

作業Branch: `chatgpt/stabilization-songproject-contracts-20261015`

復元点:
- `restore/develop-before-stabilization-20261015`

今回の安定化ではVersion文書、SongProject v1所有権、データ保持、CIを整合させる。IndexedDB / Clip / Stem / Memo / SongProject schemaは変更しない。

## 最重要の役割

MIDI Analyzerの役割は2つだけ。

1. **素材を集める**
2. **曲を理解する**

正式Workflow:

`作曲シート → 必要なら Moises → MIDI Analyzer → Demo Composer → Arrangement Lab → 必要なら Cubasis → PC DAW（必須）`

正本:
- `docs/ROLE_BOUNDARY.md`
- `docs/SONG_PROJECT_V1.md`
- `src/export/songProjectAdapter.js`

MIDI Analyzer自身がComposition / Arrangementの所有者にならない。

## SongProject v1 所有権契約

MIDI Analyzerが更新してよい領域:
- `analysis`
- 解析対象を表す`reference` metadata
- `compatibility.midiAnalyzer`
- `updatedAt`

既定で保持する領域:
- `lineage`
- `intent`
- `basic`（BPM / Key / Scaleを解析だけで上書きしない）
- `composition`
- `arrangement`
- `history`
- `assets`
- `export`

`basic`を解析値へ反映するのは、`updateBasic: true`を明示した操作だけ。Audio/MIDI/Stem BlobそのものをSongProject JSONへ埋め込まない。

契約テスト:
- `test/songProjectOwnershipContract.test.js`
- `test/songProjectAdapter.test.js`
- `.github/workflows/ci.yml`

## Storage / Compatibility

- Database `midi-analyzer`: version 3
- `savedMidis`: 元MIDI + Normalized Song
- `savedClips`: Clip Library。新規Clip Schema 2、旧v1保持
- `savedTakes`: legacy Part Recorder Take。退役済みだが削除しない
- Database `midi-analyzer-stems`: version 1
- Stem BlobはIndexedDB側に保持し、SongProjectはmetadata/referenceだけを持つ

## Git / Release

- `develop`: 開発統合
- `main`: CI/build/回帰合格の公開候補 + GitHub Pages公開元
- mainへ直接pushしない
- 過去Version / Branch / Tag / Backupを削除・上書きしない
- 大きな変更前にrestore branchを作る
- stable tagはAndroid実機 + 必要なCubasis/Cubase実機確認後のみ

## 開発時の必須確認

```bash
node --test test/songProjectOwnershipContract.test.js
npm test
npm run build
```

CIではUnit test、Production build、Basic Pitch local model asset確認、360/390/430px相当のMobile Chromium回帰を継続する。TypeScriptは使用していないため専用typecheckは現状未設定。

## 触らない部分

- `main`を開発用にしない
- 元MIDI由来Noteを分析目的で自動変更しない
- 保存OFF時に元MIDI binaryを永続化しない
- Key / Chord / Section / Motif / 転調 / Track役割を自動確定しない
- Higher-level Metricsを品質Scoreとして扱わない
- 外部AIへ自動送信しない
- 本格Composition / Arrangement機能を追加しない
- SongProject v1の他Owner領域をAnalyzer都合で変更しない

## 残る実機確認

- Android実機でMoises WAV/MP3/M4A Stem Import
- Android PWA / 再起動後設定保持
- 長尺Audio / quota / Cancel / retry
- Clip v1 / v2混在Library
- Cubasis / Cubase実機取込
