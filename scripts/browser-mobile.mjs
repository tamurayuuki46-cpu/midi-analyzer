import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import { noteEventsToMidi } from '../src/audio/noteEventsToMidi.js';

const midi = noteEventsToMidi([
  { pitchMidi: 60, startTimeSeconds: 0, durationSeconds: 0.5, amplitude: 0.8 },
  { pitchMidi: 64, startTimeSeconds: 0.5, durationSeconds: 0.5, amplitude: 0.7 },
  { pitchMidi: 67, startTimeSeconds: 1, durationSeconds: 0.5, amplitude: 0.7 },
], { bpm: 120, ppq: 480 });
await fs.mkdir('test-results', { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [360, 390, 430]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true, acceptDownloads: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(process.env.ANALYZER_URL || 'http://127.0.0.1:8081/midi-analyzer/');
    assert.match(await page.title(), /^MIDI Archive\/Analyzer v0\.26-dev$/, 'Browser title must use the current app version');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Import overflows at ${width}px`);
    await page.getByText('⓪ 作曲シート', { exact: true }).waitFor();
    await page.getByText('① MIDI解析', { exact: true }).waitFor();
    await page.getByText('今ここ・任意', { exact: true }).waitFor();
    await page.getByText('② 作曲', { exact: true }).waitFor();
    await page.getByText('③ 編曲', { exact: true }).waitFor();
    await page.getByText('④ DAWへ', { exact: true }).waitFor();
    await page.getByText('① MIDI解析は必須ではありません。', { exact: true }).waitFor();

    // --- Analyzer / Archive split (same PWA, same IndexedDB) ---
    const viewSwitch = page.locator('[data-app-view-switch]');
    await viewSwitch.waitFor();
    const analyzerButton = viewSwitch.getByRole('button', { name: /^Analyzer/ });
    const archiveButton = viewSwitch.getByRole('button', { name: /^Archive/ });
    assert.equal(await analyzerButton.getAttribute('aria-pressed'), 'true', 'Analyzer must be the default view');
    assert.equal(await page.evaluate(() => document.body.dataset.appView), 'analyzer');
    for (const button of [analyzerButton, archiveButton]) {
      const box = await button.boundingBox();
      assert.ok(box && box.height >= 44, 'View switch buttons must be 44px+ tall');
    }

    const beginnerStart = page.locator('.beginner-start-panel');
    await beginnerStart.getByRole('heading', { name: 'MIDIを1つ開いて、今見る3つを知る', exact: true }).waitFor();
    await beginnerStart.getByRole('button', { name: 'MIDIファイルを選ぶ', exact: true }).waitFor();
    // Archive-only tools must not be visible in the Analyzer view.
    for (const selector of ['#audio-to-midi-root', '#audio-note-tools-root', '#stem-reference-root', '#saved-midi-list']) {
      assert.equal(await page.locator(selector).isVisible(), false, `${selector} must be hidden in Analyzer`);
    }
    assert.equal(await page.locator('#save-midi').isChecked(), false, 'Analyzer keeps device save optional (OFF)');
    await page.getByRole('heading', { name: 'MIDIを開いて解析する', exact: true }).waitFor();

    await archiveButton.click();
    assert.equal(await archiveButton.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.evaluate(() => location.hash), '#archive', 'Archive must be addressable by hash');
    assert.equal(await page.locator('#save-midi').isChecked(), true, 'Archive enables device save by default');
    await page.getByRole('heading', { name: 'MIDIを取り込んで保存する', exact: true }).waitFor();
    assert.equal(await beginnerStart.isVisible(), false, 'Analyzer start card must be hidden in Archive');
    assert.equal(await page.locator('#saved-midi-list').isVisible(), true, 'Saved MIDI list belongs to Archive');
    for (const selector of ['#audio-to-midi-root', '#audio-note-tools-root', '#stem-reference-root']) {
      assert.equal(await page.locator(selector).evaluate((el) => el.hidden), false, `${selector} must not be force-hidden in Archive`);
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Archive start overflows at ${width}px`);
    await page.goBack();
    assert.equal(await page.evaluate(() => document.body.dataset.appView), 'analyzer', 'Back button must return to Analyzer');
    assert.equal(await page.locator('#save-midi').isChecked(), false);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Analyzer start overflows at ${width}px`);

    const songDataTrigger = page.locator('.song-data-trigger');
    await songDataTrigger.waitFor();
    await songDataTrigger.click();
    const songDataPanel = page.locator('.song-data-panel');
    await songDataPanel.getByText('保存した曲を開く', { exact: true }).waitFor();
    assert.equal(await songDataPanel.locator('[data-action="save"]').isDisabled(), true, 'Save must be disabled before analysis');
    assert.equal(await songDataPanel.locator('[data-action="next"]').isDisabled(), true, 'Next must be disabled before analysis');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Song data menu overflows at ${width}px`);
    await page.locator('.song-data-close').click();

    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Global flow overflows at ${width}px`);

    await page.locator('#midi-file').setInputFiles({ name: 'mobile-regression.mid', mimeType: 'audio/midi', buffer: Buffer.from(midi) });
    await page.locator('#save-midi').check();
    await page.getByRole('button', { name: 'MIDIを読み込む', exact: true }).click();

    await beginnerStart.waitFor({ state: 'hidden' });

    // "今見る3つ": at most three items, ordered by the chosen intent, no scoring words.
    const focus = page.locator('[data-analyzer-focus]');
    await focus.waitFor({ state: 'visible' });
    await focus.getByRole('heading', { name: 'mobile-regression.mid', exact: true }).waitFor();
    const focusCount = await focus.locator('[data-focus-item]').count();
    assert.ok(focusCount <= 3, 'Analyzer focus must never show more than three items');
    if (focusCount > 0) {
      await focus.getByText('Evidence', { exact: true }).first().waitFor();
      await focus.getByText('Meaning', { exact: true }).first().waitFor();
      await focus.getByText('Action', { exact: true }).first().waitFor();
    }
    const focusIntent = focus.locator('[data-focus-intent]');
    assert.ok(await focusIntent.locator('option').count() >= 5, 'Focus must expose the analysis intents');
    await focusIntent.selectOption('climax-shape');
    assert.ok(await focus.locator('[data-focus-item]').count() <= 3, 'Focus stays within three items after changing intent');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('midi-analyzer:diagnostic-intent:v1'))), 'climax-shape', 'Focus intent must share the v0.25 intent preference');
    await focusIntent.selectOption('neutral');
    assert.equal(await page.locator('[data-analyzer-focus]').evaluate((el) => /採点|スコア|Score|[0-9]+\s*点/.test(el.textContent.replaceAll('採点しません', ''))), false, 'Focus must not present scores');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Analyzer focus overflows at ${width}px`);
    assert.equal(await page.locator('#saved-midi-list').isVisible(), false, 'Saved list stays out of the Analyzer');
    assert.equal(await page.locator('[data-clip-library-root]').isVisible(), false, 'Clip Library stays out of the Analyzer');

    const beginnerPanel = page.locator('.beginner-mode-panel');
    await beginnerPanel.getByRole('heading', { name: '初心者モード', exact: true }).waitFor();
    assert.equal(await beginnerPanel.locator('[data-beginner-details]').evaluate((el) => el.open), false, 'Five-metric detail is folded by default');
    await beginnerPanel.locator('[data-beginner-details] > summary').click();
    await beginnerPanel.getByText('Metric', { exact: true }).first().waitFor();
    await beginnerPanel.getByText('Meaning', { exact: true }).first().waitFor();
    await beginnerPanel.getByRole('heading', { name: '次に試せること', exact: true }).waitFor();
    await beginnerPanel.getByRole('heading', { name: '参考曲から借りるのは音符ではなく考え方', exact: true }).waitFor();
    assert.equal(await beginnerPanel.locator('[data-beginner-metric]').count(), 6, 'Beginner mode must show five core metrics plus note function');
    const noteFunctionMetric = beginnerPanel.locator('[data-beginner-metric="note-function"]');
    await noteFunctionMetric.getByText(/音の役割:/).waitFor();
    await noteFunctionMetric.getByText(/Resolve .* Suspension .* Anticipation .* Landing/).waitFor();
    assert.ok(await beginnerPanel.locator('[data-reference-insight]').count() > 0, 'Beginner mode must expose abstract Reference → Action insights');
    assert.equal(await page.locator('[data-analysis-tabs]').isHidden(), true, 'Detailed tabs must start hidden in beginner mode');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Beginner mode overflows at ${width}px`);

    await songDataTrigger.click();
    assert.equal(await songDataPanel.locator('[data-action="save"]').isEnabled(), true, 'Save must enable after analysis');
    assert.equal(await songDataPanel.locator('[data-action="next"]').isEnabled(), true, 'Next must enable after analysis');
    await page.locator('.song-data-close').click();

    await beginnerPanel.getByRole('button', { name: '詳細モード', exact: true }).click();
    assert.equal(await page.locator('[data-analysis-tabs]').isVisible(), true, 'Detailed tabs must become visible');
    assert.equal(await focus.isVisible(), false, 'Focus card steps aside in detail mode');
    await page.getByRole('heading', { name: 'mobile-regression.mid', exact: true }).waitFor();
    assert.ok(await page.evaluate(() => localStorage.getItem('midi-analyzer.analysis-mode.v1') === 'detail'), 'Detail preference must persist locally');

    const expectedTabs = ['概要', 'Harmony', 'Melody', 'Bass', 'Rhythm', 'Structure', 'Visual', 'Compare', 'Export', 'AI', 'Metrics', 'Parts'];
    for (const name of expectedTabs) {
      await page.getByRole('tab', { name, exact: true }).click();
      await page.getByRole('tabpanel', { name, exact: true }).waitFor({ state: 'visible' });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name} overflows at ${width}px`);
    }
    assert.equal(await page.getByRole('tab', { name: 'Recorder', exact: true }).count(), 0, 'Recorder must stay retired from the main workflow');
    assert.equal(await page.getByRole('tab', { name: 'Library', exact: true }).count(), 0, 'Library is Archive-owned and must not be an Analyzer tab');

    await page.getByRole('tab', { name: 'Structure', exact: true }).click();
    await page.getByRole('heading', { name: 'Phrase contour / Peak / Climax候補', exact: true }).waitFor();
    await page.getByRole('heading', { name: 'Section間 Landing比較', exact: true }).waitFor();
    await page.getByRole('heading', { name: '曲の特徴 Top 5', exact: true }).waitFor();
    assert.ok(await page.locator('[data-top-characteristics] [data-top-characteristic]').count() > 0, 'Structure must expose whole-song characteristic insights');
    await page.getByRole('heading', { name: '目的から分析する', exact: true }).waitFor();
    const intentSelect = page.locator('[data-diagnostic-intent]');
    await intentSelect.waitFor({ state: 'visible' });
    assert.ok(await intentSelect.locator('option').count() >= 5, 'v0.25 must expose multiple analysis intents');
    await page.getByRole('heading', { name: 'Section比較', exact: true }).waitFor();
    await page.getByRole('heading', { name: '分析値の意味', exact: true }).waitFor();
    await page.getByRole('heading', { name: '目的に合わせた見直し候補 TOP 3', exact: true }).waitFor();
    assert.ok(await page.locator('[data-select-priority]').count() > 0, 'v0.25 must expose at least one single-variable experiment');
    await page.getByRole('button', { name: '選んだ1項目をArrangement Labへ渡す', exact: true }).waitFor();
    await page.getByRole('button', { name: '採用として記録', exact: true }).waitFor();
    await page.getByRole('button', { name: '見送りとして記録', exact: true }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `v0.25 Intent Diagnostic Loop overflows at ${width}px`);

    await page.getByRole('tab', { name: 'Compare', exact: true }).click();
    await page.getByRole('heading', { name: '修正前 → 修正後の再分析', exact: true }).waitFor();
    await page.getByText('修正前MIDIを比較用に選ぶと、現在のMIDIを修正後として再分析できます。', { exact: true }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `v0.25 Before/After compare overflows at ${width}px`);

    await page.getByRole('tab', { name: 'Melody', exact: true }).click();
    await page.getByRole('heading', { name: 'Chord / Scale / 解決・着地候補', exact: true }).waitFor();
    await page.getByRole('heading', { name: '前後の動きから見るChord外音', exact: true }).waitFor();
    await page.getByRole('heading', { name: '緊張から解決へどう動くか', exact: true }).waitFor();
    await page.getByRole('heading', { name: 'フレーズの着地点', exact: true }).waitFor();
    await page.getByText('Passing候補', { exact: true }).waitFor();
    await page.getByText('Neighbor候補', { exact: true }).waitFor();
    await page.getByText('Approach候補', { exact: true }).waitFor();
    await page.getByText('Suspension候補', { exact: true }).waitFor();
    await page.getByText('Anticipation候補', { exact: true }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Note Function II overflows at ${width}px`);

    await page.getByRole('tab', { name: '概要', exact: true }).click();
    const functionGuide = page.locator('[data-piano-roll-function-guide]');
    await functionGuide.waitFor({ state: 'visible' });
    await functionGuide.getByText(/音の役割色分け:/).waitFor();
    assert.ok(await page.locator('.piano-note[class*="is-function-"]').count() > 0, 'Piano Roll must expose note-function classes');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Piano Roll note colors overflow at ${width}px`);

    await page.getByRole('tab', { name: 'Export', exact: true }).click();
    await page.getByRole('heading', { name: 'Demo Composerへ渡す', exact: true }).waitFor();
    const handoffCard = page.locator('.handoff-card');
    assert.equal(await handoffCard.locator('.handoff-primary').count(), 1, 'Handoff must expose one primary action');
    assert.equal(await handoffCard.locator('[data-handoff-now]').textContent(), '曲データを保存');
    assert.equal(await handoffCard.locator('[data-handoff-save]').evaluate((el) => el.classList.contains('handoff-primary')), true);

    const handoffDownloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: '1. 曲データを保存', exact: true }).click();
    const handoffDownload = await handoffDownloadPromise;
    assert.match(handoffDownload.suggestedFilename(), /_song_project_v1\.json$/);
    assert.equal(await page.getByRole('button', { name: '2. Demo Composerを開く', exact: true }).isEnabled(), true);
    assert.equal(await handoffCard.locator('.handoff-primary').count(), 1, 'Handoff must keep one primary action after save');
    assert.equal(await handoffCard.locator('[data-handoff-open]').evaluate((el) => el.classList.contains('handoff-primary')), true);
    assert.equal(await handoffCard.locator('[data-handoff-now]').textContent(), 'Demo Composerを開く');
    const handoff = await page.evaluate(() => JSON.parse(localStorage.getItem('music-project-songproject-handoff-v1')));
    assert.equal(handoff.kind, 'music-project-songproject-handoff');
    assert.equal(handoff.targetApp, 'demo-composer');
    assert.equal(handoff.songProject.kind, 'song-project');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Handoff guide overflows at ${width}px`);

    // Key change and Clip Library moved to Archive; the same open song is used.
    assert.equal(await page.locator('[data-midi-key-tools-root]').isVisible(), false, 'Key tools stay out of the Analyzer');
    await archiveButton.click();
    const archiveSong = page.locator('#archive-song-root');
    await archiveSong.getByRole('heading', { name: 'mobile-regression.mid', exact: true }).waitFor();
    await archiveSong.getByRole('heading', { name: '4小節素材を保存・検索', exact: true }).waitFor();
    await archiveSong.getByRole('heading', { name: 'Key変更・Song Projectへ適合', exact: true }).waitFor();
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Target Key MIDI', exact: true }).click();
    const download = await pending;
    const output = await fs.readFile(await download.path());
    assert.equal(output.subarray(0, 4).toString(), 'MThd');

    await page.getByText('素材の出自', { exact: true }).waitFor();
    await page.getByRole('region', { name: '保存済みMIDI', exact: true }).getByText('mobile-regression.mid', { exact: true }).waitFor();
    assert.equal(await page.locator('[data-analysis-tabs]').isVisible(), false, 'Analysis tabs stay out of the Archive');
    assert.equal(await page.locator('[data-analyzer-focus]').isVisible(), false, 'Focus stays out of the Archive');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Archive song area overflows at ${width}px`);
    await page.screenshot({ path: `test-results/archive-mobile-${width}.png` });

    await archiveSong.getByRole('button', { name: 'この曲をAnalyzerで見る', exact: true }).click();
    assert.equal(await page.evaluate(() => document.body.dataset.appView), 'analyzer');
    await page.locator('[data-analysis-tabs]').waitFor({ state: 'visible' });

    await beginnerPanel.getByRole('button', { name: '初心者モード', exact: true }).click();
    assert.equal(await page.locator('[data-analysis-tabs]').isHidden(), true, 'Beginner mode must hide detailed tabs again');
    assert.ok(await page.evaluate(() => localStorage.getItem('midi-analyzer.analysis-mode.v1') === 'beginner'), 'Beginner preference must persist locally');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Beginner return overflows at ${width}px`);
    await page.screenshot({ path: `test-results/analyzer-mobile-${width}.png` });

    // Saved MIDI can be re-opened in the Analyzer without writing a second copy.
    await archiveButton.click();
    const savedRegion = page.getByRole('region', { name: '保存済みMIDI', exact: true });
    assert.equal(await savedRegion.locator('.saved-card').count(), 1);
    await savedRegion.getByRole('button', { name: 'Analyzerで開く', exact: true }).click();
    await page.locator('[data-analyzer-focus]').waitFor({ state: 'visible' });
    assert.equal(await page.evaluate(() => document.body.dataset.appView), 'analyzer');
    await page.locator('[data-analyzer-focus]').getByRole('heading', { name: 'mobile-regression.mid', exact: true }).waitFor();
    await archiveButton.click();
    assert.equal(await savedRegion.locator('.saved-card').count(), 1, 'Re-opening must not duplicate the saved MIDI');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Saved card actions overflow at ${width}px`);
    await page.reload();
    assert.equal(await page.evaluate(() => document.body.dataset.appView), 'archive', 'Last used view must be restored');
    await page.getByRole('region', { name: '保存済みMIDI', exact: true }).getByText('mobile-regression.mid', { exact: true }).waitFor();
    assert.deepEqual(errors, [], 'No application console errors');
    await context.close();
  }
  console.log('MIDI Archive/Analyzer 360/390/430px v0.26 Analyzer/Archive split / focus-3 / v0.25 intent-driven diagnostic / single-variable experiment / phrase-section-top5 insight / before-after compare / beginner start / six-metric Metric→Meaning→Action / Note Function II / handoff / storage regression passed');
} finally { await browser.close(); }
