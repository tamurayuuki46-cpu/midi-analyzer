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
・Basic Pitch変換後のNote削除 / Pitch / Start / Length編集 / 1/16 Quantizeを追加
・Chromatic Transpose / Degree Preserve / 12 Key生成コアを追加
・Basic Pitch変換素材用Key変更 / 12 Key UIを追加
・一般MIDI再Export用Format 1 encoderを追加
・外部分離Stem Import、専用IndexedDB保存、Solo / Mute試聴を追加
・Basic Pitch / Key transpose / MIDI re-export / Stem Blob分離の自動テストを追加

【変更】
・端末共有の既定対象をDemo Composer project.jsonからSong Project v1へ変更
・既存のAnalysis JSON / CSV / Markdown / Chord Text / Demo Composer project.json Exportは継続
・Basic Pitch model assetsをBuild時に同一Origin配信用distへコピー
・Stem Audio BlobはSongProject JSONではなく`midi-analyzer-stems` IndexedDBへ分離

【修正】
・Analyzer再解析時にcomposition / arrangementを上書きしないOwnership保護を追加
・Audio変換時の長時間処理について8分 / 120MB / 30秒chunkの安全制限を追加

【未対応】
・一般MIDI Import画面とKey変更UIの最終イベント接続
・Stem metadataのSongProject.reference自動同期
・Basic Pitch Web Worker化
・Android実機での長尺Basic Pitchメモリ検証
・本番Deploy / develop・mainへの統合
