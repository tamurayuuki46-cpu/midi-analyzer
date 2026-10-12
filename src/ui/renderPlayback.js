import './playback.css';
import { createPlaybackController, isWebAudioSupported } from '../playback/index.js';

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const rounded = Math.ceil(seconds);
  const minutes = Math.floor(rounded / 60);
  const remaining = rounded % 60;
  return `${minutes}:${String(remaining).padStart(2, '0')}`;
}

export function mountPlayback(root, song) {
  if (!root) return null;

  const supported = isWebAudioSupported();
  let state = 'ready';
  let message = '';
  let controller = null;

  function render() {
    const duration = controller?.getDurationSeconds?.() ?? 0;
    const eventCount = controller?.getEventCount?.() ?? 0;
    const playable = supported && eventCount > 0;
    const playing = state === 'playing';
    const status = !supported
      ? 'このブラウザはWeb Audio再生に対応していません。'
      : eventCount === 0
        ? '再生できるNoteがありません。'
        : playing
          ? `再生中 · ${formatDuration(duration)}`
          : message || `準備完了 · ${formatDuration(duration)} · ${eventCount} notes`;

    root.innerHTML = `
      <div class="playback-controls">
        <button type="button" class="playback-button playback-button-primary" data-playback-play ${!playable || playing ? 'disabled' : ''}>
          ▶ Play
        </button>
        <button type="button" class="playback-button" data-playback-stop ${!playing ? 'disabled' : ''}>
          ■ Stop
        </button>
      </div>
      <p class="playback-status" role="status" aria-live="polite">${status}</p>
      <p class="playback-note">v0.1は曲頭からの簡易プレビューです。Tempo Mapは反映します。通常Noteは簡易シンセ音、Channel 10は短いクリック音で、元の楽器音色は再現しません。</p>
    `;
  }

  controller = createPlaybackController(song, {
    onStateChange(event) {
      state = event.state;
      if (event.state === 'ended') message = '再生が終了しました。';
      else if (event.state === 'stopped') message = '停止しました。';
      else if (event.state === 'playing') message = '';
      render();
    },
  });

  root.addEventListener('click', async (event) => {
    const playButton = event.target.closest('[data-playback-play]');
    if (playButton) {
      playButton.disabled = true;
      message = '再生を開始しています…';
      render();
      try {
        await controller.play();
      } catch (error) {
        state = 'ready';
        message = `再生できませんでした: ${error.message}`;
        render();
      }
      return;
    }

    const stopButton = event.target.closest('[data-playback-stop]');
    if (stopButton) {
      stopButton.disabled = true;
      await controller.stop();
    }
  });

  render();
  return controller;
}
