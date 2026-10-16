# Branch Inventory midi-analyzer (2026-10-17)

作成目的: ブランチ整理前の記録。ブランチ名とコミットIDから、削除後も同じ時点を再作成できるようにする。
このファイルを作成した時点では、ブランチの削除・変更は行っていない。

総数: 163本 / main取り込み済み: 159 / develop取り込み済み(mainは未): 1 / 未取り込み: 3

判定: 「取り込み済み」はブランチ先頭のコミットがmain(またはdevelop)の履歴に含まれる場合。Squash mergeされたブランチは「未取り込み」と表示される。

## 接頭辞別の集計

| 接頭辞 | 本数 | main取り込み済み | develop取り込み済み | 未取り込み |
|---|---|---|---|---|
| (root) | 2 | 1 | 1 | 0 |
| backup | 7 | 7 | 0 | 0 |
| chatgpt | 98 | 96 | 0 | 2 |
| chore | 3 | 3 | 0 | 0 |
| claude | 2 | 2 | 0 | 0 |
| docs | 1 | 1 | 0 | 0 |
| feature | 7 | 6 | 0 | 1 |
| release | 9 | 9 | 0 | 0 |
| restore | 34 | 34 | 0 | 0 |

## 全ブランチ一覧

| ブランチ | コミットID | 最終更新 | 状態 | 最終コミットの件名 |
|---|---|---|---|---|
| `develop` | `1561ff5` | 2026-10-17 | develop取り込み済み | Sync final v0.26 published status back to develop |
| `main` | `08e5bfe` | 2026-10-17 | main取り込み済み | Publish v0.26 release status record |
| `backup/main_before_release_docs_sync_2026-10-13` | `693a3e5` | 2026-10-13 | main取り込み済み | Publish MIDI Analyzer from main |
| `backup/main_before_v0.10_autotest_integration_2026-10-13` | `8e7cd8f` | 2026-10-12 | main取り込み済み | Initial commit |
| `backup/main_before_v0.11_basic_pitch_origin_fix_2026-10-13` | `f67c3d5` | 2026-10-13 | main取り込み済み | Merge pull request #25 from tamurayuuki46-cpu/develop |
| `backup/main_before_v0.11_mobile_regression_2026-10-13` | `07f36e6` | 2026-10-13 | main取り込み済み | Merge pull request #27 from tamurayuuki46-cpu/develop |
| `backup/main_v0.10_before_pages-main_2026-10-13` | `cbcef65` | 2026-10-13 | main取り込み済み | Release MIDI Analyzer v0.10-dev to main |
| `backup/v0.10-dev_songproject-integrated` | `cca7e8a` | 2026-10-13 | main取り込み済み | Merge SongProject v1 Analyzer integration into develop |
| `backup/v0.9-dev_before_songproject` | `915f7f5` | 2026-10-13 | main取り込み済み | Sync v0.9 public handoff status |
| `chatgpt/analyzer-archive-split-proposal` | `a5cbb06` | 2026-10-16 | 未取り込み | docs: propose Analyzer and Archive split |
| `chatgpt/diagnostic-loop-v0.24` | `fd91ad9` | 2026-10-15 | main取り込み済み | docs: sync AI handoff for v0.24 |
| `chatgpt/insight-v0.23` | `84e0930` | 2026-10-15 | main取り込み済み | docs: sync AI handoff to v0.23 insights |
| `chatgpt/metric-meaning-action-v0.19` | `7932148` | 2026-10-15 | main取り込み済み | test: align mobile regression with v0.19 beginner analysis |
| `chatgpt/midi-analyzer-v0.25-intent-loop` | `89d88a9` | 2026-10-15 | main取り込み済み | docs: sync v0.25 handoff and published status |
| `chatgpt/note-function-analysis-v0.20` | `038672d` | 2026-10-15 | main取り込み済み | test: sync mobile regression with v0.20 note functions |
| `chatgpt/note-resolution-v0.21` | `523387e` | 2026-10-15 | main取り込み済み | docs: add v0.21 version history entry |
| `chatgpt/release-docs-sync-20261013` | `f3f37d6` | 2026-10-13 | main取り込み済み | docs: synchronize released versions and main publication policy |
| `chatgpt/release-sheet-summary-v0.6` | `d7b00b7` | 2026-10-14 | main取り込み済み | feat: expose current song composition sheet summary (v0.6) |
| `chatgpt/rename-midi-archive-analyzer-v0.18-20261015` | `af5c1a2` | 2026-10-15 | main取り込み済み | test: wait for async beginner transition after import |
| `chatgpt/resolution-landing-v0.22` | `445ccde` | 2026-10-15 | main取り込み済み | test: sync mobile regression with v0.22 UI |
| `chatgpt/sheet-summary-v0.6` | `485ff9e` | 2026-10-14 | main取り込み済み | feat: show imported composition sheet summary from song data menu |
| `chatgpt/stabilization-songproject-contracts-20261015` | `9ac0685` | 2026-10-15 | 未取り込み | docs: align MIDI Analyzer README with v0.17-dev |
| `chatgpt/v0.1-android-verified` | `974a4ff` | 2026-10-13 | main取り込み済み | Record Android smoke-test result |
| `chatgpt/v0.1-android-verified-milestone` | `efc9047` | 2026-10-13 | main取り込み済み | Record Android Chrome verification |
| `chatgpt/v0.1-basic-analysis` | `adc5469` | 2026-10-12 | main取り込み済み | Mark v0.1 basic analysis complete in roadmap |
| `chatgpt/v0.1-before-basic-analysis` | `2b5c644` | 2026-10-12 | main取り込み済み | Merge Chord Analyzer + Degree into develop |
| `chatgpt/v0.1-before-chord-analyzer` | `54c0879` | 2026-10-12 | main取り込み済み | Merge Key / Scale Analyzer into develop |
| `chatgpt/v0.1-before-github-pages` | `1a03dce` | 2026-10-12 | main取り込み済み | Merge minimal Play Stop playback into develop |
| `chatgpt/v0.1-before-indexeddb` | `8a1a88b` | 2026-10-12 | main取り込み済み | Merge MIDI import and normalization core into develop |
| `chatgpt/v0.1-before-key-analyzer` | `4677bcd` | 2026-10-12 | main取り込み済み | Merge parser regression fixtures into develop |
| `chatgpt/v0.1-before-midi-import` | `649dc15` | 2026-10-12 | main取り込み済み | chore: add v0.1-dev shared project scaffold |
| `chatgpt/v0.1-before-pages-deploy-fix` | `8137b61` | 2026-10-12 | main取り込み済み | Merge GitHub Pages publishing into develop |
| `chatgpt/v0.1-before-parser-fixture` | `b052689` | 2026-10-12 | main取り込み済み | Merge read-only Piano Roll into develop |
| `chatgpt/v0.1-before-piano-roll` | `817a313` | 2026-10-12 | main取り込み済み | chore: remove accidental placeholder |
| `chatgpt/v0.1-before-playback` | `0da4e0a` | 2026-10-12 | main取り込み済み | Merge Melody Bass Rhythm basic analysis into develop |
| `chatgpt/v0.1-chord-analyzer` | `8362e98` | 2026-10-12 | main取り込み済み | feat: add chord analyzer and degree |
| `chatgpt/v0.1-feature-complete-milestone` | `1a03dce` | 2026-10-12 | main取り込み済み | Merge minimal Play Stop playback into develop |
| `chatgpt/v0.1-github-pages` | `4c507af` | 2026-10-12 | main取り込み済み | Record GitHub Pages publishing support |
| `chatgpt/v0.1-indexeddb` | `254b937` | 2026-10-12 | main取り込み済み | feat: add opt-in IndexedDB MIDI storage |
| `chatgpt/v0.1-key-analyzer` | `edbbda7` | 2026-10-12 | main取り込み済み | feat: add Key and Scale candidate analyzer |
| `chatgpt/v0.1-midi-import` | `f9656bd` | 2026-10-12 | main取り込み済み | docs: finalize AI handoff after import implementation |
| `chatgpt/v0.1-pages-deploy-fix` | `72e9f1f` | 2026-10-13 | main取り込み済み | Document GitHub Pages deploy fix |
| `chatgpt/v0.1-parser-fixture` | `9db1a99` | 2026-10-12 | main取り込み済み | test: add fixed MIDI parser regression fixtures |
| `chatgpt/v0.1-piano-roll` | `725b5a4` | 2026-10-12 | main取り込み済み | feat: add read-only piano roll |
| `chatgpt/v0.1-playback` | `3eeec96` | 2026-10-12 | main取り込み済み | Mark v0.1 feature scope implemented in version history |
| `chatgpt/v0.11-before-clip-similarity` | `01fe4a9` | 2026-10-13 | main取り込み済み | Merge pull request #28 from tamurayuuki46-cpu/chatgpt/v0.11-mobile-bro |
| `chatgpt/v0.11-cloud-browser-fix` | `27ec53f` | 2026-10-13 | main取り込み済み | fix: accept Basic Pitch MIDI origin in Analyzer (v0.11-dev) |
| `chatgpt/v0.11-mobile-browser-regression` | `b5293b8` | 2026-10-13 | main取り込み済み | test: verify Analyzer mobile workflow and persistence |
| `chatgpt/v0.12-post-merge-doc-sync` | `4fc0fce` | 2026-10-13 | main取り込み済み | docs: finalize v0.12 post-merge handoff |
| `chatgpt/v0.12-version-history-sync` | `e60ec5e` | 2026-10-13 | main取り込み済み | docs: finalize v0.12 restore and merge record |
| `chatgpt/v0.2-before-structure-motif` | `efc9047` | 2026-10-13 | main取り込み済み | Record Android Chrome verification |
| `chatgpt/v0.2-before-top1-progression` | `4df7914` | 2026-10-13 | main取り込み済み | Merge MIDI Analyzer v0.2-dev into develop |
| `chatgpt/v0.2-feature-complete-milestone` | `48f4086` | 2026-10-13 | main取り込み済み | Fix chord detail filtering |
| `chatgpt/v0.2-published-milestone` | `4df7914` | 2026-10-13 | main取り込み済み | Merge MIDI Analyzer v0.2-dev into develop |
| `chatgpt/v0.2-structure-motif` | `48f4086` | 2026-10-13 | main取り込み済み | Fix chord detail filtering |
| `chatgpt/v0.2-top1-progression` | `8b668e3` | 2026-10-13 | main取り込み済み | Add Top 1 chord progression test coverage |
| `chatgpt/v0.2.1-feature-complete-milestone` | `8b668e3` | 2026-10-13 | main取り込み済み | Add Top 1 chord progression test coverage |
| `chatgpt/v0.2.1-published-milestone` | `e2bb3ad` | 2026-10-13 | main取り込み済み | Merge MIDI Analyzer v0.2.1-dev into develop |
| `chatgpt/v0.20-feature-complete-milestone` | `aaee849` | 2026-10-15 | main取り込み済み | Merge PR #52: v0.20-dev note-function analysis |
| `chatgpt/v0.21-feature-complete-milestone` | `fc29b06` | 2026-10-15 | main取り込み済み | Merge PR #53: v0.21-dev temporal note resolution |
| `chatgpt/v0.22-feature-complete-milestone` | `e58fcb1` | 2026-10-15 | main取り込み済み | Merge PR #56: finalize v0.22 integration docs |
| `chatgpt/v0.22-release-doc-sync` | `17fed9a` | 2026-10-15 | main取り込み済み | docs: finalize v0.22 version history entry |
| `chatgpt/v0.23-feature-complete-milestone` | `41a6b0e` | 2026-10-15 | main取り込み済み | Merge PR #58: v0.23-dev phrase and insight analysis |
| `chatgpt/v0.23-publication-doc-sync` | `fc041b4` | 2026-10-15 | main取り込み済み | docs: record v0.23 publication |
| `chatgpt/v0.23-published-doc-sync` | `a923a7f` | 2026-10-15 | main取り込み済み | docs: record v0.23 publication |
| `chatgpt/v0.23-release-doc-sync` | `2a7fac2` | 2026-10-15 | main取り込み済み | docs: record v0.23 develop integration |
| `chatgpt/v0.24-dev-complete-milestone` | `323b425` | 2026-10-15 | main取り込み済み | Merge PR #66: finalize v0.24 integration docs |
| `chatgpt/v0.24-feature-complete-milestone` | `71bb387` | 2026-10-15 | main取り込み済み | Merge PR #65: v0.24 diagnostic loop |
| `chatgpt/v0.24-postmerge-docs` | `4602d14` | 2026-10-15 | main取り込み済み | docs: record v0.24 develop integration state |
| `chatgpt/v0.24-published-docs` | `1650895` | 2026-10-15 | main取り込み済み | docs: add canonical published status for v0.24 |
| `chatgpt/v0.24-published-milestone` | `5515d28` | 2026-10-15 | main取り込み済み | Merge PR #68: record v0.24 published status |
| `chatgpt/v0.25-dev-complete-milestone` | `65667b0` | 2026-10-15 | main取り込み済み | Merge PR #69: sync published v0.24 back to develop |
| `chatgpt/v0.25-feature-complete-milestone` | `65667b0` | 2026-10-15 | main取り込み済み | Merge PR #69: sync published v0.24 back to develop |
| `chatgpt/v0.25-final-milestone-20261015` | `89d88a9` | 2026-10-15 | main取り込み済み | docs: sync v0.25 handoff and published status |
| `chatgpt/v0.25-implementation` | `65667b0` | 2026-10-15 | main取り込み済み | Merge PR #69: sync published v0.24 back to develop |
| `chatgpt/v0.25-intent-layer-work` | `65667b0` | 2026-10-15 | main取り込み済み | Merge PR #69: sync published v0.24 back to develop |
| `chatgpt/v0.25-postmerge-doc-sync` | `aabc20c` | 2026-10-15 | main取り込み済み | docs: sync v0.25 develop handoff status |
| `chatgpt/v0.25-public-state-backsync` | `5f21e14` | 2026-10-15 | main取り込み済み | Record v0.25 published status |
| `chatgpt/v0.25-publish` | `bb682d5` | 2026-10-15 | main取り込み済み | Merge v0.25 post-integration status docs |
| `chatgpt/v0.25-published-doc-sync` | `3e73aae` | 2026-10-15 | main取り込み済み | docs: sync v0.25 public handoff status |
| `chatgpt/v0.25-published-milestone` | `5f21e14` | 2026-10-15 | main取り込み済み | Record v0.25 published status |
| `chatgpt/v0.3-before-compare` | `e2bb3ad` | 2026-10-13 | main取り込み済み | Merge MIDI Analyzer v0.2.1-dev into develop |
| `chatgpt/v0.3-compare-trend` | `32693c5` | 2026-10-13 | main取り込み済み | Add v0.3 comparison test plan |
| `chatgpt/v0.3-feature-complete-milestone` | `32693c5` | 2026-10-13 | main取り込み済み | Add v0.3 comparison test plan |
| `chatgpt/v0.4-before-part-deep` | `32693c5` | 2026-10-13 | main取り込み済み | Add v0.3 comparison test plan |
| `chatgpt/v0.4-before-tabbed-ui` | `5070c14` | 2026-10-13 | main取り込み済み | Revert accidental placeholder file |
| `chatgpt/v0.4-feature-complete-milestone` | `22fb731` | 2026-10-13 | main取り込み済み | Preserve full version history while adding v0.3 and v0.4 |
| `chatgpt/v0.4-part-deep` | `22fb731` | 2026-10-13 | main取り込み済み | Preserve full version history while adding v0.3 and v0.4 |
| `chatgpt/v0.4-published-milestone` | `b42c264` | 2026-10-13 | main取り込み済み | Publish MIDI Analyzer v0.4-dev |
| `chatgpt/v0.4.1-feature-complete-milestone` | `9fcc63a` | 2026-10-13 | main取り込み済み | Update handoff for v0.4.1 tabbed UI |
| `chatgpt/v0.4.1-tabbed-ui` | `9fcc63a` | 2026-10-13 | main取り込み済み | Update handoff for v0.4.1 tabbed UI |
| `chatgpt/v0.5-feature-complete-milestone` | `0d26a6d` | 2026-10-13 | main取り込み済み | Add Visual tab to UI specification |
| `chatgpt/v0.5-visualization` | `0d26a6d` | 2026-10-13 | main取り込み済み | Add Visual tab to UI specification |
| `chatgpt/v0.6-before-clip-library` | `0d26a6d` | 2026-10-13 | main取り込み済み | Add Visual tab to UI specification |
| `chatgpt/v0.6-before-part-recorder` | `cb9111a` | 2026-10-13 | main取り込み済み | Merge PR #15: v0.6-dev Visualization + Clip Library |
| `chatgpt/v0.6-clip-library` | `4da4f60` | 2026-10-13 | main取り込み済み | Update handoff for v0.6 Clip Library |
| `chatgpt/v0.6-feature-complete-milestone` | `4da4f60` | 2026-10-13 | main取り込み済み | Update handoff for v0.6 Clip Library |
| `chatgpt/v0.6-published-milestone` | `cb9111a` | 2026-10-13 | main取り込み済み | Merge PR #15: v0.6-dev Visualization + Clip Library |
| `chatgpt/v0.7-before-integration-export` | `c7053f1` | 2026-10-13 | main取り込み済み | Merge PR #16: v0.7-dev Part Recorder |
| `chatgpt/v0.7-feature-complete-milestone` | `256ec2a` | 2026-10-13 | main取り込み済み | Mark v0.7 verification complete |
| `chatgpt/v0.7-part-recorder` | `256ec2a` | 2026-10-13 | main取り込み済み | Mark v0.7 verification complete |
| `chatgpt/v0.7-published-milestone` | `c7053f1` | 2026-10-13 | main取り込み済み | Merge PR #16: v0.7-dev Part Recorder |
| `chatgpt/v0.9-complete-pre-v1` | `57f71eb` | 2026-10-13 | main取り込み済み | Mark v0.9 verification complete |
| `chatgpt/v0.9-feature-complete-milestone` | `57f71eb` | 2026-10-13 | main取り込み済み | Mark v0.9 verification complete |
| `chatgpt/v0.9-published-milestone` | `915f7f5` | 2026-10-13 | main取り込み済み | Sync v0.9 public handoff status |
| `chatgpt/workflow-boundary-cleanup` | `fac93c5` | 2026-10-13 | main取り込み済み | test: align mobile regression with 13-tab Analyzer workflow |
| `chatgpt/workflow-boundary-phase2` | `1c31a35` | 2026-10-13 | main取り込み済み | Merge MIDI Analyzer v0.12-dev role boundary into develop |
| `chore/main-autotest-stabletag-policy` | `54565ee` | 2026-10-13 | main取り込み済み | docs: record main and stable-tag policy |
| `chore/main-ci-gates` | `a18576f` | 2026-10-13 | main取り込み済み | ci: gate main with analyzer tests and build |
| `chore/pages-from-main` | `c533be9` | 2026-10-13 | main取り込み済み | docs: define main as Pages deployment source |
| `claude/analyzer-archive-split` | `5526f32` | 2026-10-17 | main取り込み済み | feat: separate Analyzer and Archive views (v0.26-dev) |
| `claude/saved-midi-reanalyze` | `7b8cda8` | 2026-10-17 | main取り込み済み | feat: open saved MIDI in Analyzer from Archive without re-saving |
| `docs/published-status-v0.26-20261017` | `d9c3c73` | 2026-10-17 | main取り込み済み | docs: record v0.26 public release status |
| `feature/analyzer-project-sync` | `d74f5e6` | 2026-10-13 | main取り込み済み | docs: document Stem to Basic Pitch and reference sync |
| `feature/beginner-mode-v0.17-20261014` | `2e4925e` | 2026-10-14 | main取り込み済み | fix: align mobile regression with hidden beginner-mode details |
| `feature/json-handoff-guide-v0.1` | `45ba32e` | 2026-10-14 | 未取り込み | docs: document MIDI Analyzer handoff flow |
| `feature/mobile-first-flow-v0.14` | `fa039f0` | 2026-10-14 | main取り込み済み | docs: record v0.14 restore points |
| `feature/song-data-menu-v0.15` | `fd8b6e7` | 2026-10-14 | main取り込み済み | test: expect MIDI Analyzer v0.15 SongProject metadata |
| `feature/song-memo-v0.16` | `3400d54` | 2026-10-14 | main取り込み済み | test: update analyzer app version expectation to v0.16 |
| `feature/songproject-unification` | `4384d14` | 2026-10-13 | main取り込み済み | docs: align MIDI Analyzer with canonical SongProject v1 |
| `release/docs-sync-v0.13-20261014` | `e291ab3` | 2026-10-14 | main取り込み済み | docs: record current v0.13 public release |
| `release/json-handoff-guide-v0.13` | `9c37cca` | 2026-10-14 | main取り込み済み | test: keep main workflow and add handoff regression |
| `release/midi-archive-analyzer-v0.18-public-20261015` | `79de0e3` | 2026-10-15 | main取り込み済み | Merge PR #49: MIDI Archive/Analyzer v0.18 beginner-first flow |
| `release/mobile-first-flow-v0.14` | `f10d720` | 2026-10-14 | main取り込み済み | docs: define MIDI Analyzer public mobile-first workflow |
| `release/song-data-menu-public-20261014` | `21d6183` | 2026-10-14 | main取り込み済み | test: cover public MIDI Analyzer song data menu |
| `release/song-memo-public-v0.15-20261014` | `b13ad3e` | 2026-10-14 | main取り込み済み | docs: document public Analyzer song memo |
| `release/songproject-unification` | `5be060d` | 2026-10-13 | main取り込み済み | release: align Analyzer with canonical SongProject v1 |
| `release/v0.17-public-20261014` | `f182c9a` | 2026-10-14 | main取り込み済み | merge: reconcile main public history for v0.17 release |
| `release/v0.26-publish-20261017` | `6e5f4eb` | 2026-10-17 | main取り込み済み | Merge pull request #76 from tamurayuuki46-cpu/claude/saved-midi-reanal |
| `restore/before-workflow-boundary-2026-10-13` | `01fe4a9` | 2026-10-13 | main取り込み済み | Merge pull request #28 from tamurayuuki46-cpu/chatgpt/v0.11-mobile-bro |
| `restore/convergence-final-pre-divergence-20261015` | `8bb89e6` | 2026-10-15 | main取り込み済み | Backsync v0.25 public state to develop |
| `restore/develop-before-beginner-mode-v0.17-20261014` | `951cc65` | 2026-10-14 | main取り込み済み | Merge PR #44: song memo v0.16 |
| `restore/develop-before-diagnostic-loop-v0.24-20261015` | `24aa532` | 2026-10-15 | main取り込み済み | Merge published v0.23 main back into develop |
| `restore/develop-before-insight-v0.23-20261015` | `e58fcb1` | 2026-10-15 | main取り込み済み | Merge PR #56: finalize v0.22 integration docs |
| `restore/develop-before-intent-loop-v0.25-20261015` | `65667b0` | 2026-10-15 | main取り込み済み | Merge PR #69: sync published v0.24 back to develop |
| `restore/develop-before-json-handoff-guide-20261014` | `5231c81` | 2026-10-13 | main取り込み済み | feat: align MIDI Analyzer with canonical SongProject v1 |
| `restore/develop-before-metric-meaning-action-v0.19-20261015` | `79de0e3` | 2026-10-15 | main取り込み済み | Merge PR #49: MIDI Archive/Analyzer v0.18 beginner-first flow |
| `restore/develop-before-midi-archive-analyzer-v0.18-20261015` | `97b74f5` | 2026-10-14 | main取り込み済み | Merge PR #47: publish MIDI Analyzer v0.17-dev |
| `restore/develop-before-mobile-first-flow-20261014` | `a088a58` | 2026-10-14 | main取り込み済み | feat: add beginner SongProject handoff to Demo Composer |
| `restore/develop-before-note-function-v0.20-20261015` | `f3504ed` | 2026-10-15 | main取り込み済み | Merge pull request #51 from tamurayuuki46-cpu/chatgpt/metric-meaning-a |
| `restore/develop-before-note-resolution-v0.21-20261015` | `aaee849` | 2026-10-15 | main取り込み済み | Merge PR #52: v0.20-dev note-function analysis |
| `restore/develop-before-resolution-landing-v0.22-20261015` | `fc29b06` | 2026-10-15 | main取り込み済み | Merge PR #53: v0.21-dev temporal note resolution |
| `restore/develop-before-song-data-menu-20261014` | `1b0608f` | 2026-10-14 | main取り込み済み | Merge PR #38: mobile-first app workflow v0.14 |
| `restore/develop-before-song-memo-v0.16-20261014` | `81d5f54` | 2026-10-14 | main取り込み済み | Merge pull request #42 from tamurayuuki46-cpu/chatgpt/sheet-summary-v0 |
| `restore/develop-before-songproject-unification-20261013` | `9c0167e` | 2026-10-13 | main取り込み済み | Merge MIDI Analyzer v0.12 version history sync |
| `restore/develop-before-stabilization-20261015` | `1171164` | 2026-10-14 | main取り込み済み | Merge PR #46: beginner mode v0.17-dev |
| `restore/develop-before-v0.26-publish-20261017` | `6e5f4eb` | 2026-10-17 | main取り込み済み | Merge pull request #76 from tamurayuuki46-cpu/claude/saved-midi-reanal |
| `restore/drive-backup-20261015-v0.18` | `3f393bd` | 2026-10-15 | main取り込み済み | Merge PR #50: publish MIDI Archive/Analyzer v0.18 |
| `restore/feature-mobile-first-flow-v0.14-complete-20261014` | `e232960` | 2026-10-14 | main取り込み済み | docs: define Analyzer role in mobile-first workflow |
| `restore/main-before-mobile-first-flow-20261014` | `0e3169e` | 2026-10-14 | main取り込み済み | Merge PR #37: sync current public release docs v0.13 |
| `restore/main-before-sheet-summary-v0.6-20261014` | `4d97cff` | 2026-10-14 | main取り込み済み | Merge PR #41: publish top-right song data menu |
| `restore/main-before-song-memo-public-v0.15-20261014` | `9d2ae8c` | 2026-10-14 | main取り込み済み | Merge pull request #43 from tamurayuuki46-cpu/chatgpt/release-sheet-su |
| `restore/main-before-songproject-unification-20261013` | `94cff62` | 2026-10-13 | main取り込み済み | Merge pull request #29 from tamurayuuki46-cpu/develop |
| `restore/main-before-v0.17-public-20261014` | `0016331` | 2026-10-14 | main取り込み済み | Merge PR #45: public Analyzer song memo v0.15 |
| `restore/main-before-v0.18-public-20261015` | `97b74f5` | 2026-10-14 | main取り込み済み | Merge PR #47: publish MIDI Analyzer v0.17-dev |
| `restore/main-before-v0.23-publish-20261015` | `3f393bd` | 2026-10-15 | main取り込み済み | Merge PR #50: publish MIDI Archive/Analyzer v0.18 |
| `restore/main-before-v0.24-publish-20261015` | `d19a822` | 2026-10-15 | main取り込み済み | docs: sync v0.23 published status |
| `restore/main-before-v0.25-publish-20261015` | `5515d28` | 2026-10-15 | main取り込み済み | Merge PR #68: record v0.24 published status |
| `restore/main-before-v0.26-publish-20261017` | `5f21e14` | 2026-10-15 | main取り込み済み | Record v0.25 published status |
| `restore/v0.12-role-boundary-feature-complete` | `1c31a35` | 2026-10-13 | main取り込み済み | Merge MIDI Analyzer v0.12-dev role boundary into develop |
| `restore/v0.12-workflow-boundary-feature-complete` | `1c31a35` | 2026-10-13 | main取り込み済み | Merge MIDI Analyzer v0.12-dev role boundary into develop |
| `restore/v0.12-workflow-boundary-phase1` | `1c31a35` | 2026-10-13 | main取り込み済み | Merge MIDI Analyzer v0.12-dev role boundary into develop |
| `restore/v0.14-mobile-first-integrated-20261014` | `1b0608f` | 2026-10-14 | main取り込み済み | Merge PR #38: mobile-first app workflow v0.14 |
