import './beginnerStart.css';

const START_MODE_KEY = 'midi-analyzer.start-mode.v1';
const BEGINNER = 'beginner';
const DETAIL = 'detail';

function readStartMode() {
  try {
    return globalThis.localStorage?.getItem(START_MODE_KEY) === DETAIL ? DETAIL : BEGINNER;
  } catch {
    return BEGINNER;
  }
}

function saveStartMode(mode) {
  try {
    globalThis.localStorage?.setItem(START_MODE_KEY, mode);
  } catch {
    // Preference only. The app must keep working without localStorage.
  }
}

function setAdvancedRootsVisible(visible) {
  ['#audio-to-midi-root', '#audio-note-tools-root', '#stem-reference-root'].forEach((selector) => {
    const root = document.querySelector(selector);
    if (root) root.hidden = !visible;
  });
}

function focusMidiImport({ save }) {
  const checkbox = document.querySelector('#save-midi');
  const fileInput = document.querySelector('#midi-file');
  const importPanel = document.querySelector('[aria-labelledby="import-title"]');
  if (checkbox) checkbox.checked = Boolean(save);
  importPanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  globalThis.setTimeout(() => fileInput?.focus(), 250);
}

export function mountBeginnerStart(root) {
  if (!root) return null;

  const panel = document.createElement('section');
  panel.className = 'panel beginner-start-panel';
  panel.setAttribute('aria-labelledby', 'beginner-start-title');
  panel.innerHTML = `
    <div class="beginner-start-heading">
      <div>
        <p class="eyebrow">BEGINNER START</p>
        <h2 id="beginner-start-title">まず、やりたいことを1つ選ぶ</h2>
        <p>MIDI Archive/Analyzerは「素材を保存・整理する」と「曲を分析する」の2つが中心です。</p>
      </div>
      <span class="status-pill">初心者向け</span>
    </div>

    <div class="beginner-start-grid">
      <button class="beginner-start-action" type="button" data-beginner-start-action="archive">
        <span class="beginner-start-number">1</span>
        <span><strong>MIDIを保存・整理する</strong><small>端末保存をONにして、Archiveとして残します。</small></span>
      </button>
      <button class="beginner-start-action" type="button" data-beginner-start-action="analyze">
        <span class="beginner-start-number">2</span>
        <span><strong>MIDIを解析する</strong><small>保存しなくても、その場で特徴を確認できます。</small></span>
      </button>
    </div>

    <div class="beginner-start-secondary">
      <button type="button" data-beginner-start-action="saved">保存済みMIDIを見る</button>
      <button type="button" data-beginner-start-action="detail" aria-expanded="false">詳細ツールを表示</button>
    </div>

    <p class="beginner-start-note">迷ったら「MIDIを解析する」でOKです。読み込み後はKey・音域・音の動き・リズム・反復を5項目にまとめて表示します。</p>
  `;
  root.replaceChildren(panel);

  const detailButton = panel.querySelector('[data-beginner-start-action="detail"]');
  let mode = readStartMode();

  function applyStartMode(nextMode, { persist = true } = {}) {
    mode = nextMode === DETAIL ? DETAIL : BEGINNER;
    const detailVisible = mode === DETAIL;
    setAdvancedRootsVisible(detailVisible);
    detailButton.textContent = detailVisible ? '詳細ツールを隠す' : '詳細ツールを表示';
    detailButton.setAttribute('aria-expanded', detailVisible ? 'true' : 'false');
    if (persist) saveStartMode(mode);
  }

  panel.addEventListener('click', (event) => {
    const button = event.target.closest('[data-beginner-start-action]');
    if (!button) return;
    const action = button.dataset.beginnerStartAction;

    if (action === 'archive') {
      focusMidiImport({ save: true });
      return;
    }
    if (action === 'analyze') {
      focusMidiImport({ save: false });
      return;
    }
    if (action === 'saved') {
      document.querySelector('#saved-midi-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (action === 'detail') {
      applyStartMode(mode === DETAIL ? BEGINNER : DETAIL);
    }
  });

  window.addEventListener('midi-analyzer-song-ready', () => {
    panel.hidden = true;
  }, { once: true });

  applyStartMode(mode, { persist: false });
  return Object.freeze({
    getMode: () => mode,
    setMode: (nextMode) => applyStartMode(nextMode),
  });
}
