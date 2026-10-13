Version: v0.12-dev
更新日: 2026-10-13

【追加】
・MIDI Analyzerの正式責務を「素材を集める / 曲を理解する」の2つへ固定。
・Clip素材にProvenanceを追加。自作 / 参考曲 / Moises Stem / Audio→MIDI / RipX / 書籍 / Plugin / 手入力等を記録・検索可能化。
・Stemに後方互換のProvenance metadataを追加。Moisesを主な外部分離入口としてUIへ反映。
・Clip v2 / Stem provenanceの自動テスト。

【変更】
・Part RecorderをMain UI / Tabから退役。
・Moises → MIDI Analyzer → Demo Composerの素材Workflowを正本化。
・README / ROLE_BOUNDARY / STORAGE_SPEC / CLIP_LIBRARY_SPEC / AI_HANDOFFを新責務へ同期。
・Tabを14→13へ整理。

【修正】
・役割外だったRecorderがAnalyzerの主導線を分断していた情報設計を修正。

【互換性】
・既存`savedTakes`を削除しない。
・IndexedDB `midi-analyzer` version 3を維持。
・既存Clip Schema 1を自動変換・削除しない。
・Stem DB version 1を維持し、旧Stemのprovenance欠落を許容。

【復元ポイント】
・`restore/before-workflow-boundary-2026-10-13`

【未対応】
・Android実機でMoises由来WAV/MP3/M4A、長尺Audio、quota、Provenance入力を確認。
・Cubasis / Cubase実機回帰。
・stable tag作成（実機確認後のみ）。
