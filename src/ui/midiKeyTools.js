import { normalizedSongToMidi } from '../midi/normalizedSongToMidi.js';
import { generate12KeyVariants, transposeNotesToKey } from '../midi/transpose.js';

let song = null;
let detectedKey = 'C major';
let targetProject = null;

function safeName(value) {
  return String(value || 'midi').replace(/\.(mid|midi)$/i, '').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 70) || 'midi';
}

function normalizeKeyLabel(value) {
  return String(value || '').replaceAll('♯', '#').replaceAll('♭', 'b').trim();
}

function songProjectKey(project) {
  const key = normalizeKeyLabel(project?.basic?.key);
  const scale = String(project?.basic?.scale || '').trim().toLowerCase();
  if (!key) return null;
  if (/\b(major|minor|maj|min)$/i.test(key)) return key;
  return `${key} ${scale === 'minor' || scale === 'min' ? 'minor' : 'major'}`;
}

function download(bytes, name) {
  const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/midi' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function asPitchNotes(notes) {
  return notes.map((note) => ({ ...note, pitchMidi: note.pitch }));
}

function restorePitch(notes) {
  return notes.map(({ pitchMidi, ...note }) => ({ ...note, pitch: pitchMidi }));
}

function transposeSongNotes(sourceKey, targetKey, mode) {
  const sourceNotes = asPitchNotes(song.notes);
  const melodic = [];
  const melodicIndexes = [];
  sourceNotes.forEach((note, index) => {
    if (note.channel !== 9) {
      melodic.push(note);
      melodicIndexes.push(index);
    }
  });
  const changed = transposeNotesToKey(melodic, normalizeKeyLabel(sourceKey), normalizeKeyLabel(targetKey), mode);
  const next = sourceNotes.map((note) => ({ ...note }));
  melodicIndexes.forEach((originalIndex, index) => {
    next[originalIndex] = changed[index];
  });
  return restorePitch(next);
}

function twelveKeySongVariants(sourceKey, mode) {
  const sourceNotes = asPitchNotes(song.notes);
  const melodic = [];
  const melodicIndexes = [];
  sourceNotes.forEach((note, index) => {
    if (note.channel !== 9) {
      melodic.push(note);
      melodicIndexes.push(index);
    }
  });
  return generate12KeyVariants(melodic, normalizeKeyLabel(sourceKey), mode).map((variant) => {
    const next = sourceNotes.map((note) => ({ ...note }));
    melodicIndexes.forEach((originalIndex, index) => {
      next[originalIndex] = variant.notes[index];
    });
    return { ...variant, notes: restorePitch(next) };
  });
}

function mount() {
  const root = document.querySelector('[data-midi-key-tools-root]');
  if (!root || !song) return;
  const projectTarget = songProjectKey(targetProject);
  root.innerHTML = `
    <div class="feature-stack">
      <p class="feature-note">元MIDIは変更せず、新しいMIDIを書き出します。Drums (Channel 10) は移調しません。</p>
      <div class="controls-row">
        <label class="field"><span>Source Key</span><input data-mkt-source value="${normalizeKeyLabel(detectedKey)}"></label>
        <label class="field"><span>Target Key</span><input data-mkt-target value="${projectTarget || 'D major'}"></label>
        <label class="field"><span>Mode</span><select data-mkt-mode><option value="degree">Degree Preserve</option><option value="chromatic">Chromatic</option></select></label>
      </div>
      <div class="field">
        <label><span>Song Project v1</span><input data-mkt-project type="file" accept="application/json,.json"></label>
        <small>Song Projectを選ぶと basic.key / scale をTarget Keyへ読み込みます。</small>
      </div>
      <div class="button-row">
        <button data-mkt-fit class="primary-button" type="button" ${projectTarget ? '' : 'disabled'}>Song Project Keyへ合わせる</button>
        <button data-mkt-export type="button">Target Key MIDI</button>
        <button data-mkt-12 type="button">12 Key生成</button>
      </div>
      <p data-mkt-status class="feature-status" aria-live="polite">検出候補: ${normalizeKeyLabel(detectedKey)}</p>
    </div>
  `;

  const status = root.querySelector('[data-mkt-status]');
  const source = () => root.querySelector('[data-mkt-source]').value;
  const target = () => root.querySelector('[data-mkt-target]').value;
  const mode = () => root.querySelector('[data-mkt-mode]').value;
  const fitButton = root.querySelector('[data-mkt-fit]');

  function exportTarget(targetKey, suffix = targetKey) {
    const changed = transposeSongNotes(source(), targetKey, mode());
    download(
      normalizedSongToMidi(song, { notes: changed, trackNameSuffix: targetKey }),
      `${safeName(song.source?.fileName)}_${String(suffix).replace(/\s+/g, '_')}.mid`,
    );
  }

  root.querySelector('[data-mkt-project]').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const project = JSON.parse(await file.text());
      if (project?.kind !== 'song-project' || project?.schemaVersion !== 1) throw new Error('Song Project v1ではありません。');
      const key = songProjectKey(project);
      if (!key) throw new Error('Song Projectにbasic.keyがありません。');
      targetProject = project;
      root.querySelector('[data-mkt-target]').value = key;
      fitButton.disabled = false;
      status.textContent = `${project.title || 'Song Project'} のKey (${key}) をTargetへ設定しました。`;
    } catch (error) {
      targetProject = null;
      fitButton.disabled = true;
      status.textContent = `Song Projectを読めませんでした: ${error.message}`;
    }
  });

  fitButton.onclick = () => {
    try {
      const key = songProjectKey(targetProject);
      if (!key) throw new Error('Song Projectを選択してください。');
      exportTarget(key, `${targetProject.title || 'song'}_${key}`);
      status.textContent = `${targetProject.title || 'Song Project'} の ${key} に合わせたMIDIを書き出しました。`;
    } catch (error) {
      status.textContent = error.message;
    }
  };

  root.querySelector('[data-mkt-export]').onclick = () => {
    try {
      exportTarget(target());
      status.textContent = `${target()}版を書き出しました。`;
    } catch (error) {
      status.textContent = error.message;
    }
  };

  root.querySelector('[data-mkt-12]').onclick = () => {
    try {
      const variants = twelveKeySongVariants(source(), mode());
      variants.forEach((variant, index) => setTimeout(() => download(
        normalizedSongToMidi(song, { notes: variant.notes, trackNameSuffix: variant.key }),
        `${safeName(song.source?.fileName)}_${variant.key.replace(/\s+/g, '_')}.mid`,
      ), index * 120));
      status.textContent = '12 Key MIDIの保存を開始しました。Drumsは元Pitchを保持します。';
    } catch (error) {
      status.textContent = error.message;
    }
  };
}

window.addEventListener('midi-analyzer-song-ready', (event) => {
  song = event.detail?.song || null;
  detectedKey = normalizeKeyLabel(event.detail?.detectedKey || 'C major');
  queueMicrotask(mount);
});
