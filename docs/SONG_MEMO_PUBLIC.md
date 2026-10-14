# 公開版 曲データメモ帳 — MIDI Analyzer

Version: v0.15-dev
更新日: 2026-10-14

## 曲の識別

- SongProject v1を読み込んでいる場合は `projectId` を保存キーにする。
- MIDIを直接解析した場合は `midi-analyzer:${fileName}` をその解析用IDとして使う。
- 同じ表示名でもProject IDが違えば別メモとして扱う。

## 保存

入力内容はlocalStorageへ短い遅延で自動保存する。SongProject v1やIndexedDBの既存Schemaは変更しない。

## 共有

- `☁️ Drive / Notion`: Android共有画面を開き、Google DriveまたはNotionを選ぶ。
- `🤖 ChatGPTへ共有`: メモと整理依頼文を共有し、共有先でChatGPTを選ぶ。
- `📄 TXT保存`: `${曲名}_memo.txt` として端末へ保存する。
- Web Share非対応時は、Drive/NotionはTXT保存、ChatGPTはクリップボードコピー後にChatGPTを開く。

共有先アプリの表示可否と保存完了は端末側に依存する。共有画面をキャンセルした場合は成功扱いしない。

## 実機確認待ち

Android実機でGoogle Drive / Notion / ChatGPTを共有先として選び、各サービスで保存・受け取りが完了することをstable判定前に確認する。
