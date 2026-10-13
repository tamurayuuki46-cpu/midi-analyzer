import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/ui/renderIntegrationExport.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../src/ui/postV07Features.css', import.meta.url), 'utf8');

test('MIDI Analyzer exposes the beginner SongProject handoff path', () => {
  assert.match(source, /music-project-songproject-handoff-v1/);
  assert.match(source, /targetApp:\s*'demo-composer'/);
  assert.match(source, /Demo Composerへ渡す/);
  assert.match(source, /1\. 曲データを保存/);
  assert.match(source, /2\. Demo Composerを開く/);
  assert.match(source, /handoff=midi-analyzer/);
  assert.match(source, /_song_project_v1\.json/);
  assert.match(source, /もっと詳しい書き出し/);
  assert.match(source, /旧Demo Composer project\.json/);
});

test('guided handoff remains mobile friendly', () => {
  assert.match(css, /\.handoff-card/);
  assert.match(css, /\.handoff-actions/);
  assert.match(css, /@media\(max-width:560px\)/);
  assert.match(css, /grid-template-columns:1fr/);
});
