import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('top-right song data menu is wired and uses SongProject v1', async () => {
  const menu = await fs.readFile('src/ui/songDataMenu.js', 'utf8');
  const memo = await fs.readFile('src/ui/songMemoPad.js', 'utf8');
  const entry = await fs.readFile('src/ui/songDataMenuEntry.js', 'utf8');
  const index = await fs.readFile('index.html', 'utf8');

  assert.match(menu, /position:fixed/);
  assert.match(menu, /right:10px/);
  assert.match(menu, /📦 曲データ/);
  assert.match(menu, /保存した曲を開く/);
  assert.match(menu, /今の曲を保存/);
  assert.match(menu, /SongProject v1 \/ JSON/);
  assert.match(menu, /songMemoPad\.js/);
  assert.match(menu, /attachSongMemoPad/);

  assert.match(memo, /📓 メモ帳/);
  assert.match(memo, /music-project-song-memo-v1:/);
  assert.match(memo, /Drive \/ Notion/);
  assert.match(memo, /ChatGPTへ共有/);
  assert.match(memo, /navigator\.share/);
  assert.match(memo, /navigator\.clipboard/);
  assert.match(memo, /_memo\.txt/);

  assert.match(entry, /Demo Composerへ進む/);
  assert.match(entry, /isSongProject/);
  assert.match(entry, /midi-analyzer-song-ready/);
  assert.match(entry, /getMemoProject/);
  assert.match(entry, /midi-analyzer:\$\{fileName\}/);
  assert.match(index, /songDataMenuEntry\.js/);
  assert.match(index, /v0\.15-dev/);
});
