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
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Import overflows at ${width}px`);
    await page.getByText('⓪ 作曲シート', { exact: true }).waitFor();
    await page.getByText('① MIDI解析', { exact: true }).waitFor();
    await page.getByText('今ここ・任意', { exact: true }).waitFor();
    await page.getByText('② 作曲', { exact: true }).waitFor();
    await page.getByText('③ 編曲', { exact: true }).waitFor();
    await page.getByText('④ DAWへ', { exact: true }).waitFor();
    await page.getByText('① MIDI解析は必須ではありません。', { exact: true }).waitFor();

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
    await page.getByRole('heading', { name: 'mobile-regression.mid', exact: true }).waitFor();

    await songDataTrigger.click();
    assert.equal(await songDataPanel.locator('[data-action="save"]').isEnabled(), true, 'Save must enable after analysis');
    assert.equal(await songDataPanel.locator('[data-action="next"]').isEnabled(), true, 'Next must enable after analysis');
    await page.locator('.song-data-close').click();

    const expectedTabs = ['概要', 'Harmony', 'Melody', 'Bass', 'Rhythm', 'Structure', 'Visual', 'Compare', 'Library', 'Export', 'AI', 'Metrics', 'Parts'];
    for (const name of expectedTabs) {
      await page.getByRole('tab', { name, exact: true }).click();
      await page.getByRole('tabpanel', { name, exact: true }).waitFor({ state: 'visible' });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name} overflows at ${width}px`);
    }
    assert.equal(await page.getByRole('tab', { name: 'Recorder', exact: true }).count(), 0, 'Recorder must stay retired from the main workflow');

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

    await page.getByRole('tab', { name: '概要', exact: true }).click();
    await page.screenshot({ path: `test-results/analyzer-mobile-${width}.png` });
    await page.reload();
    await page.getByRole('region', { name: '保存済みMIDI', exact: true }).getByText('mobile-regression.mid', { exact: true }).waitFor();
    assert.deepEqual(errors, [], 'No application console errors');
    await context.close();
  }
  console.log('Analyzer 360/390/430px song-data / five-stage flow / import / 13 tabs / handoff / provenance / transpose / storage regression passed');
} finally { await browser.close(); }
