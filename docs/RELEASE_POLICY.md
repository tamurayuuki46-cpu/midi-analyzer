# Release Policy

更新日: 2026-10-13

## Branch / Tag policy

- `develop`: 開発統合用。
- `main`: 自動テスト合格版。unit test、production build、回帰CI、Basic Pitch model assets確認などが成功した統合版を置く。Android実機未確認でもmainへ統合してよい。
- `stable tag`: 実機確認済み版。Android実機の主要操作・保存・PWA更新・Audio→MIDI長時間処理を確認し、MIDI連携対象がある場合はCubasis / Cubase取込確認まで済んだ版だけに付与する。

## main統合前

1. Versionとdevelop headを確認。
2. main現headから復元Branchを作成。
3. developのunit / build / regression / model asset確認を成功させる。
4. CHANGELOG / VERSION_HISTORY / 関連docsを更新。
5. develop→mainはPRで行い、mainへ直接編集しない。
6. main統合後のCIとGitHub Pages公開を確認する。

## stable tag

stable tagは自動CIだけでは作らない。Android実機で、MIDI Import/Analyze、SongProject、Key変更、Stem、Basic Pitch、保存/再読込、PWA更新を確認する。長尺Audioではメモリ、Cancel、再試行も確認する。Cubasis/Cubaseへ渡すMIDIについては必要なTrack/Tempo/拍子/Channelを実機で確認する。

## Backup

- 大規模変更前、main統合前、stable tag前に復元点を残す。
- GitHubはソース履歴、Google Driveは検証済みBuild / CHANGELOG / BACKUP_MANIFESTを保持する。
- 過去Branch / Tag / Versionは削除・上書きしない。
