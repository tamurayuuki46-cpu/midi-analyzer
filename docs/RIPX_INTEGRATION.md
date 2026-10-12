# RIPX_INTEGRATION.md

## v0.1
手動。

RipX
→ MIDI Export
→ Androidへ転送
→ MIDI Analyzer Import

RipX由来Noteは `origin: "ripx"`。

## 前提
RipX由来MIDIは完全Quantizeされていない可能性がある。
元Noteを書き換えず、分析側の許容閾値を調整可能にする。

## v0.4以降
RipX Bridgeを調査 / 試作。

Windows PC
RipX
↓
RipX Bridge
↓ Wi-Fi / LAN
Android
MIDI Analyzer

## 禁止
- v0.1でBridgeを先に作らない
- MIDI AnalyzerをRipX専用形式にしない
