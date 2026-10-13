Version: v0.10-dev
更新日: 2026-10-13

【追加】
・Song Project v1 Exportを追加
・Analyzer analysis/referenceをSongProjectへ保存するAdapterを追加
・既存SongProjectへ解析結果だけを書き戻すMerge処理を追加
・Demo Composer互換ProjectをSongProject compatibilityへ保持
・SongProject Adapter自動テストを追加
・ブラウザ内Basic Pitch Audio→MIDIを追加
・Audio→MIDIのProgress / Cancel / Android向けchunk処理を追加
・変換MIDIを既存Analyzerへ自動受け渡しする経路を追加
・Chromatic Transpose / Degree Preserve / 12 Key生成の共通コアを追加
・Basic Pitch MIDI encoder / Audio validation / Key transpose自動テストを追加

【変更】
・端末共有の既定対象をDemo Composer project.jsonからSong Project v1へ変更
・既存のAnalysis JSON / CSV / Markdown / Chord Text / Demo Composer project.json Exportは継続
・Basic Pitch model assetsをBuild時に同一Origin配信用distへコピー

【修正】
・Analyzer再解析時にcomposition / arrangementを上書きしないOwnership保護を追加
・Audio変換時の長時間処理について8分 / 120MB / 30秒chunkの安全制限を追加

【未対応】
・Key変更UIから一般MIDI Import素材を直接編集する統合
・Basic Pitch変換後の詳細Note編集UI
・Web Worker化
・Stem / Reference Audio管理
・Project Home
