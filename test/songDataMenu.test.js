import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { buildChatGptMemoText, buildSongMemoText, songMemoStorageKey } from '../src/ui/songMemoPad.js';

test('top-right song data menu is wired and uses SongProject v1', async () => {
  const menu = await fs.readFile('src/ui/songDataMenu.js', 'utf8');
  const entry = await fs.readFile('src/ui/songDataMenuEntry.js', 'utf8');
  const memo = await fs.readFile('src/ui/songMemoPad.js', 'utf8');
  const bootstrap = await fs.readFile('src/ui/audioToMidiEntry.js', 'utf8');

  assert.match(menu, /position:fixed/);
  assert.match(menu, /right:10px/);
  assert.match(menu, /📦 曲データ/);
  assert.match(menu, /保存した曲を開く/);
  assert.match(menu, /今の曲を保存/);
  assert.match(menu, /SongProject v1 \/ JSON/);
  assert.match(menu, /attachSongMemoPad/);
  assert.match(entry, /Demo Composerへ進む/);
  assert.match(entry, /isSongProject/);
  assert.match(entry, /midi-analyzer-song-ready/);
  assert.match(entry, /getMemoProject/);
  assert.match(bootstrap, /songDataMenuEntry\.js/);
  assert.match(memo, /📓 メモ帳/);
  assert.match(memo, /Drive \/ Notion/);
  assert.match(memo, /ChatGPTへ共有/);
  assert.match(memo, /navigator\.share/);
  assert.match(memo, /navigator\.clipboard/);
});

test('song memo stays isolated and builds share text', () => {
  const a = { projectId: 'song-a', title: '同名曲' };
  const b = { projectId: 'song-b', title: '同名曲' };
  assert.notEqual(songMemoStorageKey(a), songMemoStorageKey(b));
  assert.match(buildSongMemoText(a, 'サビを広げる'), /同名曲/);
  assert.match(buildSongMemoText(a, 'サビを広げる'), /サビを広げる/);
  assert.match(buildChatGptMemoText(a, 'サビを広げる'), /次にやること/);
  assert.match(buildChatGptMemoText(a, 'サビを広げる'), /サビを広げる/);
});