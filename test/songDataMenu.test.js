import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('top-right song data menu is wired and uses SongProject v1', async () => {
  const menu = await fs.readFile('src/ui/songDataMenu.js', 'utf8');
  const entry = await fs.readFile('src/ui/songDataMenuEntry.js', 'utf8');
  const bootstrap = await fs.readFile('src/ui/audioToMidiEntry.js', 'utf8');

  assert.match(menu, /position:fixed/);
  assert.match(menu, /right:10px/);
  assert.match(menu, /📦 曲データ/);
  assert.match(menu, /保存した曲を開く/);
  assert.match(menu, /今の曲を保存/);
  assert.match(menu, /SongProject v1 \/ JSON/);
  assert.match(entry, /Demo Composerへ進む/);
  assert.match(entry, /isSongProject/);
  assert.match(entry, /midi-analyzer-song-ready/);
  assert.match(bootstrap, /songDataMenuEntry\.js/);
});
