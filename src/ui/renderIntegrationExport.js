import './postV07Features.css';
import { buildDemoComposerProject, buildSongProjectFromAnalysis, exportAnalysisCsv, exportAnalysisJson, exportAnalysisMarkdown, exportChordDegreeText } from '../export/index.js';
import { isSongProject, mergeAnalyzerAnalysisIntoSongProject, mergeReferenceMetadata } from '../export/songProjectAdapter.js';
import { listStemMetadata, stemToReferenceMetadata } from '../storage/stemStore.js';

function safeName(value) {
  return String(value || 'midi-analysis').replace(/\.(mid|midi)$/i, '').replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_').slice(0, 80) || 'midi-analysis';
}

function downloadText(name, text, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return blob;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function mountIntegrationExport(root, song, bundle, metrics, explanation) {
  if (!root) return null;
  const baseName = safeName(song?.source?.fileName);
  const demo = buildDemoComposerProject(song, bundle, { title: baseName });
  const common = buildSongProjectFromAnalysis(song, bundle, { title: baseName });
  let importedSongProject = null;

  async function songProjectWithReferences() {
    let project = importedSongProject
      ? mergeAnalyzerAnalysisIntoSongProject(importedSongProject, song, bundle, { updateBasic: false })
      : common.project;
    try {
      const stems = await listStemMetadata();
      project = mergeReferenceMetadata(project, stems.map(stemToReferenceMetadata));
    } catch {
      // IndexedDB unavailable: keep the SongProject without optional stem metadata.
    }
    return project;
  }

  root.innerHTML = `
    <div class="feature-stack">
      <div>
        <p class="eyebrow">INTEGRATION / EXPORT</p>
        <h3>解析結果を書き出す</h3>
        <p class="feature-note">交換JSONは共通SongProject v1です。既存SongProjectを開くと、MIDI Analyzerは <code>analysis</code> と参照情報だけを更新し、作曲シートの意図・作曲データ・編曲データ・外部Asset参照を保持します。</p>
      </div>
      <div class="export-grid">
        <button class="export-button" type="button" data-import-song-project>既存SongProjectを開く</button>
        <input type="file" accept=".json,application/json" data-song-project-input hidden>
        <button class="export-button" type="button" data-export-kind="song-project">共通SongProject v1</button>
        <button class="export-button" type="button" data-export-kind="json">Analysis JSON</button>
        <button class="export-button" type="button" data-export-kind="csv">Analysis CSV</button>
        <button class="export-button" type="button" data-export-kind="markdown">Markdown Report</button>
        <button class="export-button" type="button" data-export-kind="chords">Chord / Degree Text</button>
        <button class="export-button" type="button" data-export-kind="demo">旧Demo Composer project.json</button>
        <button class="export-button" type="button" data-export-kind="share" ${typeof navigator !== 'undefined' && navigator.share ? '' : 'disabled'}>端末の共有メニュー</button>
      </div>
      <p class="feature-status" data-project-status>既存SongProjectを開かない場合は、このMIDIから新しいSongProjectを作ります。</p>
      ${common.warnings.length ? `<div class="export-warning"><strong>共通Project変換時の注意</strong><ul class="evidence-list">${common.warnings.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : ''}
      <p class="feature-status" data-export-status aria-live="polite"></p>
    </div>
  `;

  const status = root.querySelector('[data-export-status]');
  const projectStatus = root.querySelector('[data-project-status]');
  const projectInput = root.querySelector('[data-song-project-input]');
  const importButton = root.querySelector('[data-import-song-project]');

  importButton?.addEventListener('click', () => projectInput?.click());
  projectInput?.addEventListener('change', async () => {
    const file = projectInput.files?.[0];
    if (!file) return;
    try {
      const value = JSON.parse(await file.text());
      if (!isSongProject(value)) throw new Error('SongProject v1のJSONではありません。');
      importedSongProject = structuredClone(value);
      projectStatus.textContent = `「${importedSongProject.title || 'Untitled Project'}」へ今回の解析結果を書き戻します。BPM/Key・作曲・編曲は上書きしません。`;
      status.textContent = '既存SongProjectを読み込みました。';
    } catch (error) {
      importedSongProject = null;
      projectStatus.textContent = '既存SongProjectを開かない場合は、このMIDIから新しいSongProjectを作ります。';
      status.textContent = `SongProjectを読み込めませんでした: ${error.message}`;
    } finally {
      projectInput.value = '';
    }
  });

  async function payload(kind) {
    if (kind === 'song-project') {
      const project = await songProjectWithReferences();
      const nameBase = safeName(project.title || baseName);
      return { name: `${nameBase}_song_project_v1.json`, text: `${JSON.stringify(project, null, 2)}\n`, type: 'application/json;charset=utf-8' };
    }
    if (kind === 'json') return { name: `${baseName}_analysis_v0.12.json`, text: exportAnalysisJson(bundle), type: 'application/json;charset=utf-8' };
    if (kind === 'csv') return { name: `${baseName}_analysis_v0.12.csv`, text: exportAnalysisCsv(bundle), type: 'text/csv;charset=utf-8' };
    if (kind === 'markdown') return { name: `${baseName}_report_v0.12.md`, text: exportAnalysisMarkdown(bundle, { metrics, explanation }), type: 'text/markdown;charset=utf-8' };
    if (kind === 'chords') return { name: `${baseName}_chords_degree.txt`, text: exportChordDegreeText(bundle), type: 'text/plain;charset=utf-8' };
    if (kind === 'demo') return { name: `${baseName}_demo_composer_project.json`, text: JSON.stringify(demo.project, null, 2), type: 'application/json;charset=utf-8' };
    return null;
  }

  root.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-export-kind]');
    if (!button || button.disabled) return;
    const kind = button.dataset.exportKind;
    try {
      if (kind === 'share') {
        const item = await payload('song-project');
        const file = new File([item.text], item.name, { type: item.type });
        if (navigator.canShare && !navigator.canShare({ files: [file] })) throw new Error('この端末ではファイル共有に対応していません。');
        await navigator.share({ title: 'MIDI Analyzer Export', text: 'Song Project v1', files: [file] });
        status.textContent = '共通SongProjectを端末の共有メニューへ渡しました。';
        return;
      }
      const item = await payload(kind);
      if (!item) return;
      downloadText(item.name, item.text, item.type);
      status.textContent = `${item.name} を書き出しました。`;
    } catch (error) {
      status.textContent = `書き出しできませんでした: ${error.message}`;
    }
  });

  return Object.freeze({
    songProject: common.project,
    getSongProject: songProjectWithReferences,
    demoProject: demo.project,
    warnings: common.warnings,
  });
}
