# Mobile-first Workflow — public main

更新日: 2026-10-14

`⓪ 作曲シート → ① MIDI解析（任意） → ② Demo Composer → ③ Arrangement Lab → ④ DAW`

MIDI Analyzerは①の任意工程。解析せず②へ進んでもよい。

## ⓪ 作曲シート

公開mainではDemo ComposerのMusic Project HomeにあるClaude Artifact作曲シート登録欄へ案内する。未公開の内蔵Sheet Moduleは参照しない。

## ① MIDI解析

MIDIを読み込み、必要な分析を行う。Exportでは「1. 曲データを保存」が最初の主操作。SongProject v1 JSONを必ず端末バックアップとして保存し、同じChromeではlocalStorageにも補助的に一時保存する。

保存成功後は「2. Demo Composerを開く」だけを主操作へ切り替える。Demo Composer側でユーザーが明示的に「受け取った曲を反映」を押す。自動反映しない。

## 公開main互換

公開mainにはRecorderタブが残るため、Mobile Chromium回帰でもRecorderを含む全タブを確認する。develop側のRecorder退役仕様はこのReleaseへ混ぜない。

SongProject v1 / MIDI / Clip / Stem / IndexedDB / Recorder Takeの既存データを維持する。
