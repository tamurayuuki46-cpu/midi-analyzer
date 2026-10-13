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
    const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(process.env.ANALYZER_URL || 'http://127.0.0.1:8081/midi-analyzer/');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Import overflows at ${width}px`);
    await page.locator('#midi-file').setInputFiles({ name: 'mobile-regression.mid', mimeType: 'audio/midi', buffer: Buffer.from(midi) });
    await page.locator('#save-midi').check();
    await page.getByRole('button', { name: 'MIDIを読み込む', exact: true }).click();
    await page.getByRole('heading', { name: 'mobile-regression.mid', exact: true }).waitFor();

    const expectedTabs = ['概要', 'Harmony', 'Melody', 'Bass', 'Rhythm', 'Structure', 'Visual', 'Compare', 'Library', 'Export', 'AI', 'Metrics', 'Parts'];
    for (const name of expectedTabs) {
      await page.getByRole('tab', { name, exact: true }).click();
      await page.getByRole('tabpanel', { name, exact: true }).waitFor({ state: 'visible' });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name} overflows at ${width}px`);
    }
    assert.equal(await page.getByRole('tab', { name: 'Recorder', exact: true }).count(), 0, 'Recorder must stay retired from the main workflow');

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
  console.log('Analyzer 360/390/430px import / 13 tabs / provenance / transpose / storage regression passed');
} finally { await browser.close(); }
