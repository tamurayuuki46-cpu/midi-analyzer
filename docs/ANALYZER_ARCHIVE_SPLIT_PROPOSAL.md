# Analyzer / Archive Split Proposal

更新日: 2026-10-16

## 目的

MIDI Archive/Analyzer に共存している「曲を理解する Analyzer」と「素材を集める・保存する Archive」を整理し、初心者が分析に集中できる構成へ寄せるための設計提案です。

この文書は**提案書のみ**です。実装、Version変更、Schema変更、IndexedDB Migration、既存データ削除は行いません。最終判断はユーザーが行います。

## 変更しない前提

- Normalized Song を変更しない
- SongProject v1 を変更しない
- IndexedDB `midi-analyzer` version 3 を変更しない
- IndexedDB `midi-analyzer-stems` version 1 を変更しない
- `savedMidis` / `savedClips` / `savedTakes` / `stems` の既存データを削除・変換しない
- 元MIDI由来Noteを分析目的で自動修正しない
- Key / Chord / Section / Motif / 転調 / Track役割などのCandidateを自動確定しない
- Analyzerは品質Scoreや正解判定を行わない
- Composition / ArrangementのOwnerにはならない
- 既存公開URL `/midi-analyzer/` の互換性を優先する

---

## 1. 機能の棚卸し

| 機能 | 現在の場所 | Analyzer / Archive / 廃止 のどれが妥当か | 理由 |
|---|---|---|---|
| MIDI Import | トップ / Overview / Library導線 | **共通入口**（保存はArchive、解析はAnalyzer） | 同じMIDIを「解析だけ」または「保存して管理」の両方で使うため、Import自体は共通サービスにするのが自然。保存ON/OFFで責務を分ける。 |
| Audio Import | 詳細ツール | **Archive** | 解析の主入力はMIDI。AudioはBasic PitchやStem素材化への入口で、素材管理側の責務が強い。Analyzerトップからは隠す。 |
| Audio→MIDI（Basic Pitch） | 詳細ツール / Audio関連 | **Archive** | 「曲を理解する」より「使えるMIDI素材を作る」機能。自動生成したNoteは候補として扱い、Analyzerは生成後MIDIを読むだけにする。 |
| Stem管理 | Stem Reference / IndexedDB `midi-analyzer-stems` | **Archive** | Blob保存、Provenance、Solo/Mute、Basic Pitch連携は素材管理。Analyzerは必要なら選択Stem由来のMIDI/分析結果を参照する。 |
| Clip Library | Library | **Archive** | 保存・Tag・Search・Provenanceが中心で、完全に素材管理の責務。 |
| Key Transpose / Degree Preserve / 12 Key素材生成 | Harmony / Library / Material系 | **Archive** | 分析ではなく再利用可能な素材生成。AnalyzerではKey/Degreeを「説明」し、変換処理はArchiveに置く。 |
| RipX Bridge | Import / Library系 | **Archive** | PC→Android素材受け入れは素材搬送・管理機能。Analyzerの理解フローには直接置かない。 |
| Part Recorder（退役済み） | 旧コード / `savedTakes` | **廃止（UI） / データ互換のみ保持** | すでに主UI退役済み。`savedTakes` Storeと読み取り互換は維持し、新規作成導線は復活させない。 |
| Overview分析 | overview | **Analyzer** | 基本情報、Track一覧、簡易再生、Piano Rollは理解の入口として必要。初心者表示はTOP3へ絞る。 |
| Harmony分析 | harmony | **Analyzer** | Key / Scale / Chord / Degree / Chord Detailは曲理解の中核。 |
| Melody分析 | melody | **Analyzer** | Chord Tone / Scale Tone / Passing / Resolution / Landing等は理解機能。 |
| Bass分析 | bass | **Analyzer** | Bass Contour / role / note relationは理解機能。 |
| Rhythm分析 | rhythm | **Analyzer** | Rhythm Density / Drum特徴は理解機能。 |
| Structure分析 | structure | **Analyzer** | Section / Motif / Phrase / Peak / Climax候補、Intent-aware TOP3はAnalyzerの中心候補。 |
| Visual | visual | **Analyzer（詳細のみ）** | Timeline / Contour / Density / Energy / Heatmapは理解を補助するが、初心者トップには出さない。 |
| Compare | compare | **Analyzer** | 2 MIDI比較、Reference vs Own、修正前後比較は「理解」に直接つながる。 |
| Personal Trend | compare / detail | **Analyzer（詳細のみ）** | 有用だが初心者の1曲分析には不要。詳細機能へ格納する。 |
| Track役割候補 | parts | **Analyzer（詳細のみ）** | Candidateとして表示し、自動確定しない。初心者TOP3の候補には原則入れない。 |
| Analysis Export | export | **Analyzer** | 分析結果、Meaning、Evidence、Reference Insightを外へ渡すため。 |
| Reference Export | export | **Analyzer** | 参考曲の分析情報をSongProject等へ渡す役割。 |
| Material Export | export | **Archive** | Clip / transformed material /素材JSON等は素材管理側がOwner。 |
| MIDI / Clip / StemのファイルExport | export / library | **Archive** | 保存物を持ち出す機能はArchive側。 |
| Arrangement Lab proposal-only handoff | structure / export | **Analyzer** | Evidence→Meaning→Actionから「試す1項目」を渡す機能で、曲を自動変更しないためAnalyzer責務に合う。 |
| AI Prompt Export | ai | **Analyzer（詳細のみ）** | 分析Evidenceを外部AIへ手動で渡す補助機能。自動送信はしない。初心者トップには不要。 |
| Higher-level Metrics | metrics | **廃止候補 / 内部Evidence候補** | 浮遊感・サビらしさ・驚き度などは1数値の擬似Scoreに見えやすい。公開UIからは外す案を推奨。 |

### 棚卸しの基本線

- **Analyzer = 読む / 比べる / 意味を理解する / 次に試す1項目を選ぶ**
- **Archive = 取り込む / 保存する / 整える / 探す / 再利用する / 書き出す**
- 共通で必要なのは Import、Playback、Normalized Song 読み取り等の基盤モジュールのみ
- データの物理保存先は既存IndexedDBのままにし、UI上のOwnerだけ分けることを優先する

---

## 2. 3案比較

### 案A: 現状維持 + UI整理のみ

内容:
- 現行PWAを維持
- 初心者モードを常に既定
- Archive系詳細ツールを折りたたみ / 非表示
- 詳細13タブを初期状態では見せない
- Analyzer結果を最大3項目に制限

| 観点 | 評価 |
|---|---|
| 工事量 | **小** |
| IndexedDB互換リスク | **最小**。DBやStoreに触れない |
| SongProject v1リスク | **最小** |
| 初心者の分かりやすさ | **中〜高**。入口は軽くなるが、同じアプリ内に全機能が存在する事実は残る |
| 保守負担 | **低** |
| 公開URLへの影響 | **なし** |
| 将来の責務明確さ | **中** |

長所:
- 最も安全
- 既存コード・データ・URLへの影響が少ない
- すぐ検証しやすい

短所:
- 「AnalyzerとArchiveが1アプリに詰め込まれている」構造自体は変わらない
- 詳細モードへ入ると現在の複雑さが残る

### 案B: 同一Repository内で画面 / Module分離

内容:
- Repository、PWA、公開URL、IndexedDBは維持
- 最初の入口を `Analyzer` / `Archive` の2つに明確分離
- Analyzer側は分析と比較だけを表示
- Archive側はMIDI/Audio/Stem/Clip/Bridge/素材Exportを表示
- Import / Playback / storage adapter / Normalized Song parserなどは共通Moduleを再利用

想定構成例:

```text
/midi-analyzer/
  Home
    ├─ Analyzer
    │   ├─ Analyze MIDI
    │   ├─ Intent
    │   ├─ TOP 3
    │   └─ Detail analysis
    └─ Archive
        ├─ Saved MIDI
        ├─ Clip Library
        ├─ Stem
        ├─ Audio→MIDI
        └─ Material Export
```

| 観点 | 評価 |
|---|---|
| 工事量 | **中** |
| IndexedDB互換リスク | **低**。同じOrigin / 同じDB名を維持すれば既存データをそのまま読める |
| SongProject v1リスク | **低**。adapter契約を変えなければよい |
| 初心者の分かりやすさ | **高** |
| 保守負担 | **中**。入口は2つだが共通Moduleを共有可能 |
| 公開URLへの影響 | **原則なし**。既存 `/midi-analyzer/` を維持できる |
| 将来の責務明確さ | **高** |

長所:
- 第三者レビューの「分析以外が肥大化」を直接解消できる
- データを移動せず、画面と責務だけ分けられる
- 将来、必要なら案Cへ段階的に移行できる

短所:
- Routing / navigation / module境界の整理が必要
- 同一Bundleに残す場合、物理的なコード量は減らない
- 共通Moduleの境界を曖昧にすると再び責務が混ざる

### 案C: 別Repository / 別PWAに分離

内容:
- AnalyzerとArchiveを別Repositoryまたは別PWAとして公開
- それぞれ独立Version / CI / manifest / service workerを持つ

| 観点 | 評価 |
|---|---|
| 工事量 | **大** |
| IndexedDB互換リスク | **高**。公開Originまたはpath設計次第では既存DBへ直接アクセスできない |
| SongProject v1リスク | **中**。アプリ間handoffが増える |
| 初心者の分かりやすさ | **高** |
| 保守負担 | **高**。2つのrelease / CI / docs / PWA更新が必要 |
| 公開URLへの影響 | **大**。新URLまたはredirect設計が必要 |
| 将来の責務明確さ | **最高** |

長所:
- プロダクトとして最も明確に分かれる
- Bundleやrelease cycleも分離可能

短所:
- 現時点ではデータ互換リスクが大きい
- IndexedDBはOrigin依存なので、別Originに分けると端末保存済みMIDI / Clip / Stemをそのまま共有できない可能性が高い
- Copy / Export / Import / bridgeの新設が必要になり、「作曲中に途切れる」問題を増やす恐れがある

---

## 3. 推奨案

### 推奨: 案B

**同一Repository・同一PWA・同一公開URL・同一IndexedDBのまま、Analyzer / Archiveを画面とModuleで分離する案を推奨します。**

理由:

1. 第三者レビューの主問題は「データ構造」ではなく「責務と画面の混在」
2. 既存の `midi-analyzer` v3 / Stem DB v1 をそのまま使える
3. 端末保存済みMIDI / Clip / Stemを移行せず残せる
4. Analyzerの初心者画面を大幅に単純化できる
5. 将来、本当に別PWAが必要になった場合も、先にModule境界を作っておけば案Cへ移行しやすい
6. 公開URL `/midi-analyzer/` を維持でき、既存Bookmark / PWA導線への影響を最小化できる

### 次点: 案A

Android実機で1曲通し検証を先に行い、Analyzerの複雑さが実際にどこまで障害になるかを確認したい場合は、まず案AでUI整理だけ行う選択も安全です。

### 現時点では非推奨: 案C

別Repository化は責務は明確になりますが、今の優先課題「1曲を最後まで通す」よりも移行工事そのものが大きくなります。既存IndexedDB資産を安全に跨ぐ設計が必要になるため、stable認定前の現時点では優先しない方が安全です。

---

## 4. 推奨移行手順（案B）

### Phase 0: 実装前確認

1. Android実機で既存v0.25-devの保存済みMIDI / Clip / Stem件数を確認
2. JSON / MIDI / Clip / Stemの既存Export手段を確認
3. `savedMidis` / `savedClips` / `savedTakes` / `stems` のread regressionを固定
4. SongProject v1 round-tripを固定
5. Analyzer→Arrangement Lab proposal-only handoffを回帰化

### Phase 1: 復元点

**最初のRouting / Entry UI変更を行う直前**に復元Branchを作成する。

推奨名:

`restore/develop-before-analyzer-archive-split-YYYYMMDD`

ここではまだDB Version、Store、record形式を変更しない。

### Phase 2: UIだけ分離

1. Homeで `Analyzer` / `Archive` の2入口を表示
2. Analyzer入口からArchive系機能を隠す
3. Archive入口から詳細分析タブを隠す
4. 既存DOM / logicを可能な限り再利用し、大規模書換を避ける
5. 戻る操作でHomeへ戻れるようにする

### Phase 3: Module境界整理

共通化候補:
- MIDI parser
- Normalized Song
- playback
- IndexedDB adapters
- SongProject adapter
- file download/share helpers

Analyzer専用:
- analysis engines
- compare
- Evidence / Meaning / Action
- Intent-aware TOP3
- proposal-only handoff

Archive専用:
- saved MIDI / Clip / Stem CRUD
- Audio Import
- Basic Pitch
- Key Transpose / Degree Preserve / 12Key
- RipX Bridge
- Material Export

### Phase 4: 互換確認

必須確認:
- 既存 `savedMidis` がそのまま表示できる
- 既存 `savedClips` がそのまま表示できる
- 既存 Stem Blobがそのまま表示 / 再生できる
- `savedTakes` を削除しない
- 旧PWA更新後もDB Versionが3 / Stem DB Versionが1のまま
- 保存OFFのMIDIが勝手に永続化されない
- SongProject v1の `analysis` / `reference` を保持
- `composition` / `arrangement` を消さない

### Phase 5: 実機検証後に判断

Android Chrome / installed PWAで、

`MIDIを開く → Analyzer TOP3 → 1候補選択 → Arrangement Lab handoff`

と、

`MIDI/Audioを取り込む → Archive保存 → 再起動 → 再読込`

を別々に通す。

その結果を見て案Bを正式採用するか、案Aへ戻すか、将来的に案Cへ進むかを判断する。

---

## 5. Analyzerを「最大3項目表示」に絞るルール案

### 推奨フロー

```text
MIDI Import
↓
今回の目的を1つ選ぶ
↓
既存EvidenceをIntent-awareで並べ替える
↓
TOP 3だけ表示
↓
1項目を開くとEvidence / Meaning / Action
↓
必要なら「詳細分析を見る」
```

### 既存Intent-aware TOP3の再利用

v0.25の既存機能を新しい分析エンジンへ作り直さず、そのまま**初心者Analyzerの主画面**へ昇格させる案を推奨します。

目的候補:
- 特徴を確認したい
- Sectionの差を見たい
- 盛り上がりを見たい
- 緊張 / 解決を見たい
- 着地 / 終止を見たい
- Climax位置を見たい

### TOP3選定ルール案

1. 目的との関連が高いEvidenceを優先
2. 同じ意味の指標を重複表示しない
3. 3項目は可能なら異なる観点に分散する
   - Harmony / Note relation
   - Melody / Range / Contour
   - Rhythm / Structure / Section
4. Evidence不足の項目は出さない
5. 品質の良し悪しで順位付けしない
6. 数値差が大きいだけで「問題」と表現しない
7. 各項目は必ず `Evidence → Meaning → Action` で表示
8. Actionは「元案を残して試す」提案に限定
9. 4位以下は `詳細分析を見る` の中に置く
10. 目的未選択時は「曲全体の特徴TOP3」とし、品質Scoreではなく観測情報を選ぶ

### 初心者画面で非表示を推奨するもの

- 詳細13タブ
- Personal Trend
- Full Heatmap / Timeline群
- AI Prompt Export
- Library
- Stem / Audio→MIDI
- Metrics Tab
- Parts Tab

これらは削除せず、Analyzer詳細またはArchiveへ配置する。

---

## 6. Higher-level Metricsの扱い

対象例:
- 浮遊感
- サビらしさ
- 驚き度
- 反復と変化
- 裏メロ存在感
- 編曲密度

### 選択肢1: UIから廃止

**推奨度: 高**

公開UIからMetrics Tabを外し、ユーザーに1つのScoreとして見せない。

利点:
- 擬似的な品質点に見えるリスクを最も減らせる
- 初心者画面が単純になる

欠点:
- 既存Evidence計算を完全に捨てると、他分析で使える情報まで失う可能性がある

### 選択肢2: 内部Evidenceのみ保持

**推奨案**

Higher-level Metricsという完成Scoreは表示せず、構成要素だけをIntent-aware TOP3のEvidence候補として再利用する。

例:

`浮遊感 72` と出す代わりに、

- Chord外音の持続が多い
- 解決までの時間が長い
- Root着地が少ない

のような観測可能なEvidenceへ分解する。

これなら「なぜそう見えるか」を説明でき、品質判定にもなりにくい。

### 選択肢3: 名称変更して残す

例:
- `Higher-level Metrics` → `特徴の仮説`
- `浮遊感` → `浮遊感に関連する観測`
- `サビらしさ` → `サビ候補で目立つ変化`
- `驚き度` → `予測から外れる変化の候補`

推奨度: 中。

名称変更だけではScore表示の問題が残るため、数値の総合点は外し、Evidence中心にする場合に限って有効。

### 推奨

**UI上のHigher-level Metricsは廃止し、内部Evidenceだけ保持する。**

削除対象は「計算コード」ではなく、まず**Scoreとして見せるUIと概念名**です。

既存コードの削除は別タスクで判断し、今回の提案段階では行いません。

---

## 7. データを消さない移行原則

Analyzer / Archiveを分けても、物理Storageは当面共有する。

```text
IndexedDB midi-analyzer v3
  savedMidis   ← Analyzer / Archiveからread可能
  savedClips   ← Archiveが主Owner
  savedTakes   ← legacy保持のみ

IndexedDB midi-analyzer-stems v1
  stems        ← Archiveが主Owner
```

重要:

- DB名を変えない
- DB Versionを上げない
- Storeを削除しない
- recordを一括書換しない
- UIを分けるためだけのMigrationを作らない
- Analyzerから保存済みMIDIを読む時も既存adapterを使う
- Archiveから分析を呼ぶ場合はMIDI/Normalized Songの参照だけ渡し、データ複製をしない
- 旧PWAから更新した端末を必ず回帰対象にする

### 案Cへ進む場合の追加条件

別Origin / 別PWAへ分ける場合は、IndexedDBの直接共有を前提にしない。

その前に必ず:

1. 全MIDI / Clip / StemのExport方法を用意
2. 新ArchiveへのImport方法を用意
3. Import後件数 / hash / metadata一致を検証
4. 旧PWAのデータを消さずread-onlyで一定期間残す
5. 実機Migration成功後にのみ旧導線を退役

が必要です。

---

## 8. 判断ポイント

ユーザー判断が必要な点:

1. Analyzer / Archiveを2入口に分けるだけで十分か
2. Archiveを普段のWorkflowに常時見せるか、必要時だけ開く補助画面にするか
3. Higher-level Metricsを完全非表示にするか、「特徴の仮説」として詳細画面に残すか
4. AI Prompt ExportをAnalyzer詳細に残すか、将来削除候補にするか
5. Personal TrendをAnalyzer詳細に残すか、別の学習機能へ移すか

### 推奨判断

- **案Bを採用候補**
- Analyzerを主入口、Archiveを補助入口にする
- 初心者AnalyzerはIntent-aware TOP3だけを主表示
- 詳細分析は明示操作時のみ
- Archiveは既存DBをそのまま利用
- Higher-level Metricsは公開Score UIを外し、内部Evidenceへ縮小
- Part Recorderは退役状態を維持
- 別Repository化は実機1曲通しと案B運用後まで保留

## まとめ

今回の問題は「保存Schemaが悪い」よりも「1画面・1アプリ内で役割が混ざって見える」ことが大きいと考えます。

そのため、最初からRepositoryやIndexedDBを分割するより、**同じRepository / 同じPWA / 同じStorageのまま、AnalyzerとArchiveの入口・画面・Module Ownerを分離する**方が、互換性と初心者UXの両方を守りやすいです。

最初に減らすべきなのは機能そのものではなく、初心者が同時に見せられる判断材料の数です。Analyzerの主画面を既存Intent-aware TOP3へ収束させ、その後に実機検証結果を見て物理分割の必要性を再判断することを推奨します。
