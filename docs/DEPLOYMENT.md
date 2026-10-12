# Deployment

## 方針
MIDI AnalyzerはVercelを必須にせず、GitHub Pagesを標準の公開先として利用する。

- Source branch: `develop`
- Stable branch: `main`（直接変更しない）
- Workflow: `.github/workflows/pages.yml`
- Expected URL: `https://tamurayuuki46-cpu.github.io/midi-analyzer/`

## 初回設定
GitHub Repositoryで次の設定を1回だけ行う。

1. `Settings`
2. `Pages`
3. `Build and deployment`
4. `Source` を `GitHub Actions` にする

以後は`develop`へのpushごとに自動公開される。

## 自動公開フロー
1. Checkout
2. Node.js 24 setup
3. `npm install --no-audit --no-fund`
4. `npm test`
5. `npm run build`
6. `dist/` をGitHub Pages artifactとしてupload
7. `github-pages` environmentへdeploy

TestまたはBuildが失敗した場合はdeploy jobへ進まない。

## GitHub Pages path対応
GitHub Pagesのproject siteは通常 `/midi-analyzer/` 配下で配信される。

`vite.config.js`で `base: './'` を指定し、build後のasset URLを相対化する。これによりGitHub Pages、他のstatic host、local static serverで同じbundleを扱える。

`manifest.webmanifest`の `start_url` / `scope` も `.` のため、project path配下を基準に動作する。

## Android実機確認
公開後はAndroid Chromeで以下を確認する。

- ページがHTTPSで開く
- MIDI Import
- IndexedDB保存 / 一覧 / 削除
- Piano Roll
- Key / Chord / Degree
- Melody / Bass / Rhythm分析
- Play / Stop
- 再Import時に旧音が停止する
- 再読み込み後も保存データが残る

## Vercel
Vercelの既存Deploymentは移行中の参照用として残してもよいが、GitHub Pages公開には不要。GitHub Pagesが正常動作すれば、通常の開発・実機確認はGitHubだけで完結する。
