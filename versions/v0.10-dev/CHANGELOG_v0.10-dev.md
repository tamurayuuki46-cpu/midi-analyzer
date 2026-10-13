Version: v0.10-dev
更新日: 2026-10-13

【追加】
・Song Project v1 Exportを追加
・Analyzer analysis/referenceをSongProjectへ保存するAdapterを追加
・既存SongProjectへ解析結果だけを書き戻すMerge処理を追加
・Demo Composer互換ProjectをSongProject compatibilityへ保持
・SongProject Adapter自動テストを追加

【変更】
・端末共有の既定対象をDemo Composer project.jsonからSong Project v1へ変更
・既存のAnalysis JSON / CSV / Markdown / Chord Text / Demo Composer project.json Exportは継続

【修正】
・Analyzer再解析時にcomposition / arrangementを上書きしないOwnership保護を追加

【未対応】
・Arrangement Lab最終Song.mid一括Export
・Audio Import / Basic Pitch
・Key変更 / 12 Key生成
・Stem / Reference Audio
・Project Home
