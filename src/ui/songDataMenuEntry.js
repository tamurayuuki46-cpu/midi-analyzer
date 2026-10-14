import { isSongProject } from '../export/songProjectAdapter.js';
import { mountSongDataMenu } from './songDataMenu.js';

const SOURCE_KEY = 'midi-analyzer-song-project-source-v1';
let pendingSongProject = readPending();
let analysisReady = false;
let memoProject = pendingSongProject;

function readPending() {
  try {
    const raw = sessionStorage.getItem(SOURCE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    return isSongProject(value) ? value : null;
  } catch {
    return null;
  }
}

function storePending(value) {
  pendingSongProject = value;
  memoProject = value;
  try { sessionStorage.setItem(SOURCE_KEY, JSON.stringify(value)); } catch {}
}

function delay(ms) { return new Promise((resolve) => window.setTimeout(resolve, ms)); }

async function applyPendingToExport() {
  if (!pendingSongProject) return false;
  for (let i = 0; i < 12; i += 1) {
    const input = document.querySelector('[data-song-project-input]');
    if (input && typeof DataTransfer === 'function') {
      const file = new File(
        [JSON.stringify(pendingSongProject, null, 2)],
        `${String(pendingSongProject.title || 'song-project').replace(/[\\/:*?"<>|]+/g, '_')}_song_project_v1.json`,
        { type: 'application/json' },
      );
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    await delay(50);
  }
  return false;
}

async function waitForOpenButton() {
  for (let i = 0; i < 30; i += 1) {
    const button = document.querySelector('[data-handoff-open]');
    if (button && !button.disabled) return button;
    await delay(50);
  }
  return null;
}

const picker = document.createElement('input');
picker.type = 'file';
picker.accept = '.json,.txt,application/json,text/plain';
picker.hidden = true;
document.body.append(picker);

const controller = mountSongDataMenu({
  getSheetProject: ()=>pendingSongProject,
  getMemoProject: ()=>memoProject || pendingSongProject,
  currentLabel: pendingSongProject?.title || '未選択',
  saveEnabled: false,
  nextEnabled: false,
  nextLabel: 'Demo Composerへ進む',
  onOpen() {
    picker.click();
    return 'SongProject JSONを選んでください。';
  },
  async onSave() {
    const button = document.querySelector('[data-handoff-save]');
    if (!analysisReady || !button) throw new Error('先にMIDIを読み込んで解析してください。');
    button.click();
    const open = await waitForOpenButton();
    if (!open) throw new Error('曲データの保存を確認できませんでした。Export画面からもう一度お試しください。');
    return '解析結果を含む曲データを保存しました。';
  },
  async onNext() {
    if (!analysisReady) throw new Error('先にMIDIを読み込んで解析してください。');
    let open = document.querySelector('[data-handoff-open]');
    if (!open || open.disabled) {
      const save = document.querySelector('[data-handoff-save]');
      if (!save) throw new Error('曲データを書き出せません。');
      save.click();
      open = await waitForOpenButton();
    }
    if (!open) throw new Error('Demo Composerへ渡す準備ができませんでした。');
    open.click();
  },
});

picker.addEventListener('change', async () => {
  const file = picker.files?.[0];
  picker.value = '';
  if (!file) return;
  try {
    const value = JSON.parse(await file.text());
    if (!isSongProject(value)) throw new Error('SongProject v1のJSONではありません。');
    storePending(value);
    controller.setCurrent(value.title || 'Untitled Project');
    if (analysisReady && await applyPendingToExport()) {
      controller.setStatus(`「${value.title || 'Untitled Project'}」を開き、今回の解析を書き戻す対象にしました。`, 'success');
    } else {
      controller.setStatus(`「${value.title || 'Untitled Project'}」を開きました。MIDIを解析するとこの曲に解析結果を書き戻せます。`, 'success');
    }
  } catch (error) {
    controller.setStatus(error?.message || '曲データを開けませんでした。', 'error');
  }
});

window.addEventListener('midi-analyzer-song-ready', async (event) => {
  analysisReady = true;
  controller.setSaveEnabled(true);
  controller.setNextEnabled(true);
  if (pendingSongProject) {
    memoProject = pendingSongProject;
    controller.setCurrent(pendingSongProject.title || 'Untitled Project');
    await applyPendingToExport();
  } else {
    const fileName = event.detail?.song?.source?.fileName || '解析中の曲';
    memoProject = { projectId: `midi-analyzer:${fileName}`, title: fileName };
    controller.setCurrent(fileName);
  }
});