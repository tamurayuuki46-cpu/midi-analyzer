import { getStem, listStemMetadata, saveStemFile, STEM_TYPES } from '../storage/stemStore.js';

const root = document.querySelector('#stem-reference-root');
const urls = new Map();

function releaseUrls() {
  for (const url of urls.values()) URL.revokeObjectURL(url);
  urls.clear();
}

function typeOptions() {
  return STEM_TYPES.map((type) => `<option value="${type}">${type}</option>`).join('');
}

async function durationOf(file) {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => resolve(Number.isFinite(audio.duration) ? audio.duration : null);
      audio.onerror = () => resolve(null);
      audio.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function applyMix() {
  const cards = [...root.querySelectorAll('[data-stem-id]')];
  const hasSolo = cards.some((card) => card.querySelector('[data-stem-solo]')?.checked);
  for (const card of cards) {
    const audio = card.querySelector('audio');
    const mute = card.querySelector('[data-stem-mute]')?.checked;
    const solo = card.querySelector('[data-stem-solo]')?.checked;
    audio.muted = Boolean(mute || (hasSolo && !solo));
  }
}

async function renderList() {
  const list = root?.querySelector('[data-stem-list]');
  if (!list) return;
  releaseUrls();
  const items = await listStemMetadata();
  if (!items.length) {
    list.innerHTML = '<p class="helper-note">保存済みStemはありません。</p>';
    return;
  }

  const rows = [];
  for (const item of items) {
    const full = await getStem(item.id);
    const url = URL.createObjectURL(full.blob);
    urls.set(item.id, url);
    rows.push(`
      <article class="track-card" data-stem-id="${item.id}">
        <div>
          <strong>${item.name}</strong>
          <p>${item.type} · ${item.duration ? item.duration.toFixed(1) + 's' : 'duration unknown'} · ${(item.size / 1024 / 1024).toFixed(1)}MB</p>
          <small>Convert: ${item.conversionStatus} / Analysis: ${item.analysisStatus}</small>
        </div>
        <audio controls preload="metadata" src="${url}"></audio>
        <div class="button-row">
          <label><input type="checkbox" data-stem-mute> Mute</label>
          <label><input type="checkbox" data-stem-solo> Solo</label>
          <button type="button" data-stem-basic-pitch="${item.id}">Basic Pitchへ送る</button>
        </div>
      </article>
    `);
  }
  list.innerHTML = rows.join('');
  applyMix();
}

function init() {
  if (!root) return;
  root.innerHTML = `
    <section class="panel" aria-labelledby="stem-ref-title">
      <div class="panel-heading"><div><p class="eyebrow">STEM / REFERENCE</p><h2 id="stem-ref-title">外部分離Stemを読み込む</h2></div></div>
      <p class="helper-note">Moises / RipX等で書き出したStemを端末内IndexedDBへ保存します。Audio BlobはSong Project JSONへ埋め込みません。</p>
      <form data-stem-form class="form-stack">
        <div class="field"><label>Stem Audio</label><input data-stem-file type="file" accept="audio/*" required></div>
        <div class="controls-row">
          <label class="field"><span>Type</span><select data-stem-type>${typeOptions()}</select></label>
          <label class="field"><span>Name</span><input data-stem-name placeholder="Vocal / Bassなど"></label>
        </div>
        <button class="primary-button" type="submit">端末にStem保存</button>
      </form>
      <p data-stem-status class="storage-status" aria-live="polite"></p>
      <div data-stem-list class="feature-stack"></div>
    </section>
  `;

  const form = root.querySelector('[data-stem-form]');
  const status = root.querySelector('[data-stem-status]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const file = root.querySelector('[data-stem-file]').files?.[0];
    if (!file) return;
    try {
      status.dataset.tone = 'neutral';
      status.textContent = 'Stemを端末に保存中…';
      const duration = await durationOf(file);
      await saveStemFile(file, {
        type: root.querySelector('[data-stem-type]').value,
        name: root.querySelector('[data-stem-name]').value.trim() || file.name,
        duration,
      });
      status.dataset.tone = 'success';
      status.textContent = 'Stemを端末内IndexedDBへ保存しました。Song Project JSONにはAudioを埋め込んでいません。';
      form.reset();
      await renderList();
    } catch (error) {
      status.dataset.tone = 'error';
      status.textContent = `Stemを保存できませんでした: ${error.message}`;
    }
  });

  root.addEventListener('change', (event) => {
    if (event.target.matches('[data-stem-mute],[data-stem-solo]')) applyMix();
  });

  root.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-stem-basic-pitch]');
    if (!button) return;
    button.disabled = true;
    try {
      const stem = await getStem(button.dataset.stemBasicPitch);
      if (!stem?.blob) throw new Error('Stem Audioを読み込めませんでした。');
      const file = new File([stem.blob], stem.sourceFileName || `${stem.name}.audio`, { type: stem.mimeType || stem.blob.type || 'audio/*' });
      window.dispatchEvent(new CustomEvent('stem-basic-pitch-request', {
        detail: { file, stemId: stem.id, stemName: stem.name, stemType: stem.type },
      }));
      status.dataset.tone = 'success';
      status.textContent = `${stem.name} をBasic Pitchへ渡しました。端末内で変換します。`;
    } catch (error) {
      status.dataset.tone = 'error';
      status.textContent = `StemをBasic Pitchへ渡せませんでした: ${error.message}`;
    } finally {
      button.disabled = false;
    }
  });

  window.addEventListener('stem-status-changed', () => {
    renderList().catch(() => {});
  });

  renderList().catch((error) => {
    status.textContent = `Stem一覧を読めませんでした: ${error.message}`;
  });
}

window.addEventListener('beforeunload', releaseUrls);
init();
