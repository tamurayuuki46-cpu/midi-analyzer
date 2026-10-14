import { mountBeginnerMode } from './beginnerMode.js';

window.addEventListener('midi-analyzer-song-ready', (event) => {
  const root = document.querySelector('#result');
  const song = event.detail?.song;
  if (!root || !song) return;
  mountBeginnerMode(root, song);
});
