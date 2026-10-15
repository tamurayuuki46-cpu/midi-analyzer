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
    assert.match(await page.title(), /^MIDI Archive\/Analyzer v0\.20-dev$/, 'Browser title must use the current app version');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Import overflows at ${width}px`);
    await page.getByText('⓪ 作曲シート', { exact: true }).waitFor();
    await page.getByText('① MIDI解析', { exact: true }).waitFor();
    await page.getByText('今ここ・任意', { exact: true }).waitFor();
    await page.getByText('② 作曲', { exact: true }).waitFor();
    await page.getByText('③ 編曲', { exact: true }).waitFor();
    await page.getByText('④ DAWへ', { exact: true }).waitFor();
    await page.getByText('① MIDI解析は必須ではありません。', { exact: true }).waitFor();

    const beginnerStart = page.locator('.beginner-start-panel');
    await beginnerStart.getByRole('heading', { name: 'まず、やりたいことを1つ選ぶ', exact: true }).waitFor();
    await beginnerStart.getByRole('button', { name: /MIDIを保存・整理する/ }).waitFor();
    await beginnerStart.getByRole('button', { name: /MIDIを解析する/ }).waitFor();
    assert.equal(await page.locator('#audio-to-midi-root').evaluate((el) => el.hidden), true, 'Audio→MIDI tools must start hidden in beginner start mode');
    assert.equal(await page.locator('#audio-note-tools-root').evaluate((el) => el.hidden), true, 'Audio note tools must start hidden in beginner start mode');
    assert.equal(await page.locator('#stem-reference-root').evaluate((el) => el.hidden), true, 'Stem tools must start hidden in beginner start mode');

    await beginnerStart.getByRole('button', { name: /MIDIを保存・整理する/ }).click();
    assert.equal(await page.locator('#save-midi').isChecked(), true, 'Archive action must enable device save');
    await beginnerStart.getByRole('button', { name: /MIDIを解析する/ }).click();
    assert.equal(await page.locator('#save-midi').isChecked(), false, 'Analyze action must keep device save optional');

    const detailToolsButton = beginnerStart.getByRole('button', { name: '詳細ツールを表示', exact: true });
    await detailToolsButton.click();
    assert.equal(await page.locator('#audio-to-midi-root').evaluate((el) => el.hidden), false, 'Detail start mode must reveal advanced tools');
    assert.ok(await page.evaluate(() => localStorage.getItem('midi-analyzer.start-mode.v1') === 'detail'), 'Start detail preference must persist locally');
    await beginnerStart.getByRole('button', { name: '詳細ツールを隠す', exact: true }).click();
    assert.equal(await page.locator('#audio-to-midi-root').evaluate((el) => el.hidden), true, 'Returning to beginner start mode must hide advanced tools');
    assert.ok(await page.evaluate(() => localStorage.getItem('midi-analyzer.start-mode.v1') === 'beginner'), 'Start beginner preference must persist locally');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Beginner start overflows at ${width}px`);

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
    const beginnerPanel = page.locator('.beginner-mode-panel');
    await beginnerPanel.getByRole('heading', { name: '初心者モード', exact: true }).waitFor();
    await beginnerPanel.getByText('Metric', { exact: true }).first().waitFor();
    await beginnerPanel.getByText('Meaning', { exact: true }).first().waitFor();
    await beginnerPanel.getByRole('heading', { name: '次に試せること', exact: true }).waitFor();
    await beginnerPanel.getByRole('heading', { name: '参考曲から借りるのは音符ではなく考え方', exact: true }).waitFor();
    assert.equal(await beginnerPanel.locator('[data-beginner-metric]').count(), 6, 'Beginner mode must show five core metrics plus note function');
    await beginnerPanel.locator('[data-beginner-metric="note-function"]').getByText(/音の役割:/).waitFor();
    assert.ok(await beginnerPanel.locator('[data-reference-insight]').count() > 0, 'Beginner mode must expose abstract Reference → Action insights');
    assert.equal(await page.locator('[data-analysis-tabs]').isHidden(), true, 'Detailed tabs must start hidden in beginner mode');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Beginner mode overflows at ${width}px`);

    await songDataTrigger.click();
    assert.equal(await songDataPanel.locator('[data-action="save"]').isEnabled(), true, 'Save must enable after analysis');
    assert.equal(await songDataPanel.locator('[data-action="next"]').isEnabled(), true, 'Next must enable after analysis');
    await page.locator('.song-data-close').click();

    await beginnerPanel.getByRole('button', { name: '詳細モード', exact: true }).click();
    assert.equal(await page.locator('[data-analysis-tabs]').isVisible(), true, 'Detailed tabs must become visible');
    await page.getByRole('heading', { name: 'mobile-regression.mid', exact: true }).waitFor();
    assert.ok(await page.evaluate(() => localStorage.getItem('midi-analyzer.analysis-mode.v1') === 'detail'), 'Detail preference must persist locally');

    const expectedTabs = ['概要', 'Harmony', 'Melody', 'Bass', 'Rhythm', 'Structure', 'Visual', 'Compare', 'Library', 'Export', 'AI', 'Metrics', 'Parts'];
    for (const name of expectedTabs) {
      await page.getByRole('tab', { name, exact: true }).click();
      await page.getByRole('tabpanel', { name, exact: true }).waitFor({ state: 'visible' });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name} overflows at ${width}px`);
    }
    assert.equal(await page.getByRole('tab', { name: 'Recorder', exact: true }).count(), 0, 'Recorder must stay retired from the main workflow');

    await page.getByRole('tab', { name: 'Melody', exact: true }).click();
    await page.getByRole('heading', { name: 'Chord ToneとScale Tone', exact: true }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Note Function overflows at ${width}px`);

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

    await page.getByRole('tab', { name: 'Harmony', exact: true }).click();
    const pending = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Target Key MIDI', exact: true }).click();
    const download = await pending;
    const output = await fs.readFile(await download.path());
    assert.equal(output.subarray(0, 4).toString(), 'MThd');

    await page.getByRole('tab', { name: 'Library', exact: true }).click();
    await page.getByText('素材の出自', { exact: true }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Material Library overflows at ${width}px`);

    await beginnerPanel.getByRole('button', { name: '初心者モード', exact: true }).click();
    assert.equal(await page.locator('[data-analysis-tabs]').isHidden(), true, 'Beginner mode must hide detailed tabs again');
    assert.ok(await page.evaluate(() => localStorage.getItem('midi-analyzer.analysis-mode.v1') === 'beginner'), 'Beginner preference must persist locally');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Beginner return overflows at ${width}px`);
    await page.screenshot({ path: `test-results/analyzer-mobile-${width}.png` });

    await page.reload();
    await page.getByRole('region', { name: '保存済みMIDI', exact: true }).getByText('mobile-regression.mid', { exact: true }).waitFor();
    assert.deepEqual(errors, [], 'No application console errors');
    await context.close();
  }
  console.log('MIDI Archive/Analyzer 360/390/430px beginner start / six-metric Metric→Meaning→Action / note function / detail mode / song-data / five-stage flow / import / 13 tabs / handoff / provenance / transpose / storage regression passed');
} finally { await browser.close(); }
