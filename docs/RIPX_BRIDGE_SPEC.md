# RIPX_BRIDGE_SPEC.md

## Version
v0.9-dev（v0.7 Bridge scope）

## 目的
PCでRipX等から書き出したMIDIを、同一LAN / Wi-Fi上のAndroidへ簡単に渡す。
MIDI Analyzer本体へServer機能を持たせず、PC側の小さなNode serverとして分離する。

## 起動
```bash
npm run bridge -- "C:\\path\\to\\song.mid"
```

任意Port:
```bash
npm run bridge -- "C:\\path\\to\\song.mid" --port=8787
```

Default port: `8787`

## 動作
1. PCで指定MIDIを検証
2. `0.0.0.0:<port>` でHTTP server開始
3. ConsoleへLAN IPv4 URLを表示
4. Androidで同じWi-Fi / LANからURLを開く
5. `MIDIをダウンロード`
6. 公開MIDI Analyzerを開き、そのMIDIをImport

## Endpoint
- `/` : Transfer page
- `/latest.mid` : 指定した1個のMIDI

その他は404。

## Validation
- `.mid` / `.midi`のみ
- Fileであること
- 1 byte以上
- 最大25MB
- Port 1024〜65535

## Security / Privacy
- Cloud uploadなし
- 指定MIDI以外のDirectory listingなし
- Cache-Control: no-store
- 認証機能は持たないため、信頼できる家庭内LAN等でだけ使用する
- InternetへPort Forwardしない
- Server終了はCtrl+C

## 設計理由
ブラウザのSecurity制約上、PCのLocal fileをAndroid上の別Origin PWAへ直接注入しない。
PrototypeではDownload → User選択Importの明示操作を残す。

## Android
Transfer pageは小画面で利用できる単純UIとする。

## Scope外
- Internet越しCloud relay
- Pairing token / TLS / authentication
- RipXの内部API連携
- MIDI Analyzerへ自動Import
- Background sync

これらは必要性を確認してv1.0以降に検討する。
