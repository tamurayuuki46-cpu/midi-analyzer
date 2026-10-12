# MIDI Analyzer

Androidスマートフォン中心の作曲支援PWA。

MIDIファイルを分析し、Key / Scale、Chord、Degree、Melody、Bass、Rhythm、Chord Tone / Non-Chord Toneなどを見える化して、「なぜこう聞こえるのか」を理解し、自分の作曲へ応用するためのアプリです。

## 現在Version
`v0.1-dev`

最新安定版: 未作成

## 位置づけ
音源 → RipX → MIDI Analyzer → Demo Composer → Cubasis → Cubase → 完成曲

## 現在実装済み
- `.mid` / `.midi` Import UI
- `midi-file` Parser Adapter / Song正規化
- Tempo Map / Time Signature / Track情報
- RipX origin / Warning処理
- IndexedDB端末保存（初期OFF）/ 一覧 / 削除
- 読み取り専用Piano Roll
- 固定binary MIDI Parser regression fixture
- Key / Scale Analyzer（major / minor Top 3）
- Key候補のユーザー選択UI
- Chord Analyzer（10 templates × 12 roots / Top 3）
- Chord分析対象Track選択
- Degree表示 / 音階外表示
- Melody基本分析（音域 / 跳躍 / 同音連打 / 密度 / Chord Tone比率）
- Bass基本分析（最低音移動 / Root・3rd・5th・Other / リズム型）
- Rhythm基本分析（拍位置 / シンコペーション候補 / 密度 / 16分Grid）
- Melody / Bass / Rhythm対象Track選択UI
- Chord選択・Chord分析Track変更に連動したMelody / Bass再計算
- Parser / Normalizer / Storage / Piano Roll / Key / Chord / Basic Analysis tests

## Key / Scale
Drums以外のNoteを `durationTick × velocity` で重み付けし、major/minor 24候補から上位3つを表示します。confidenceは確率ではなくprofile一致度です。解析直後には確定せず、ユーザーが選んだときだけ選択状態にします。

詳細: `docs/KEY_ANALYZER_SPEC.md`

## Chord / Degree
ユーザーがChord分析対象Trackを選び、時間Grid内の重なりNoteを `overlapDurationTick × velocity` で重み付けしてChord候補Top 3を表示します。

Degreeは選択済みKeyを基準にし、Key未選択時は第1Key候補を仮基準として「Key候補 X の場合」と明記します。音階外Chordは誤り扱いせず、♭VII等のDegreeと「音階外」を表示します。

詳細: `docs/CHORD_ANALYZER_SPEC.md`

## Melody / Bass / Rhythm
Melodyは音域・跳躍・同音連打・密度・Chord Tone / Non-Chord Tone、Bassは最低音の動き・Chord Root / 3rd / 5th / Other・リズム型、Rhythmは拍位置・シンコペーション候補・密度・16分Gridを表示します。

Melody / BassはTrackをユーザーが変更できます。Rhythmは複数Trackを選択できます。Chord Tone系の指標は選択済みChordを優先し、未選択区間では第1Chord候補を仮使用したことを画面に明示します。

詳細: `docs/BASIC_ANALYSIS_SPEC.md`

## 保存方針
「この端末に保存する」は初期状態でOFFです。ONの場合のみ元MIDIと正規化結果を端末内IndexedDBへ保存します。クラウドへの自動送信はありません。

## 開発
```bash
npm install
npm run dev
npm test
npm run build
```

Viteはplain HTML/CSS/JavaScriptとnpm依存をbundleするためだけに使用し、React等のFrameworkは導入していません。

## v0.1 Scope
入れる:
- MIDI Import / 保存選択 / Track一覧
- 読み取り専用Piano Roll
- Key / Scale候補
- Chord分析 + Degree
- Melody / Bass / Rhythm 基本分析
- 最小簡易再生（Play / Stop）

入れない:
- 音声→音符 / Stem分離 / MIDI編集
- MIDI内パート分離 / Motif / MIDI比較
- Demo Composer Export Adapter / RipX Bridge

## 開発開始時に読む順番
1. `README.md`
2. `VERSION`
3. `docs/AI_HANDOFF.md`
4. `docs/PRODUCT_SPEC.md`
5. `docs/ANALYSIS_SPEC.md`
6. `docs/MIDI_SCHEMA.md`
7. `docs/ARCHITECTURE.md`
8. `CHANGELOG.md`

重要仕様は `docs/` を正本とします。
