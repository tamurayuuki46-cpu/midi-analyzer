import './beginnerStart.css';

// Analyzer-side start card. The choice between "look" (Analyzer) and "keep" (Archive) is now made
// by the top view switch, so this card only explains the Analyzer flow and points at the file input.

function focusMidiImport() {
  const fileInput = document.querySelector('#midi-file');
  const importPanel = document.querySelector('[aria-labelledby="import-title"]');
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
        <p class="eyebrow">ANALYZER</p>
        <h2 id="beginner-start-title">MIDIを1つ開いて、今見る3つを知る</h2>
        <p>目的を1つ選ぶと、その曲で「今見る」ことを3つだけ表示します。保存はしません。</p>
      </div>
      <span class="status-pill">初心者向け</span>
    </div>
    <ol class="beginner-start-steps">
      <li>下の「MIDIを開いて解析する」でファイルを選ぶ</li>
      <li>目的を選ぶ（迷ったら「特徴を確認したい」）</li>
      <li>表示された3つを読む。もっと見たい時だけ詳細分析へ</li>
    </ol>
    <div class="beginner-start-secondary">
      <button type="button" data-beginner-start-action="analyze">MIDIファイルを選ぶ</button>
      <button type="button" data-beginner-start-action="archive">素材を保存・整理する（Archive）</button>
    </div>
  `;
  root.replaceChildren(panel);

  panel.addEventListener('click', (event) => {
    const button = event.target.closest('[data-beginner-start-action]');
    if (!button) return;
    if (button.dataset.beginnerStartAction === 'archive') {
      window.dispatchEvent(new CustomEvent('midi-analyzer-set-view', { detail: { view: 'archive' } }));
      return;
    }
    focusMidiImport();
  });

  window.addEventListener('midi-analyzer-song-ready', () => {
    panel.hidden = true;
  }, { once: true });

  return Object.freeze({});
}
