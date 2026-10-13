import './postV07Features.css';
import { buildDemoComposerProject, buildSongProjectFromAnalysis, exportAnalysisCsv, exportAnalysisJson, exportAnalysisMarkdown, exportChordDegreeText } from '../export/index.js';

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

  root.innerHTML = `
    <div class="feature-stack">
      <div>
        <p class="eyebrow">INTEGRATION / EXPORT</p>
        <h3>解析結果を書き出す</h3>
        <p class="feature-note">共通Song Project v1、JSON / CSV / Markdown / Chord・Degree Text、Demo Composer互換project.jsonを生成します。元MIDIは変更しません。</p>
      </div>
      <div class="export-grid">
        <button class="export-button" type="button" data-export-kind="song-project">Song Project v1</button>
        <button class="export-button" type="button" data-export-kind="json">Analysis JSON</button>
        <button class="export-button" type="button" data-export-kind="csv">Analysis CSV</button>
        <button class="export-button" type="button" data-export-kind="markdown">Markdown Report</button>
        <button class="export-button" type="button" data-export-kind="chords">Chord / Degree Text</button>
        <button class="export-button" type="button" data-export-kind="demo">Demo Composer project.json</button>
        <button class="export-button" type="button" data-export-kind="share" ${typeof navigator !== 'undefined' && navigator.share ? '' : 'disabled'}>端末の共有メニュー</button>
      </div>
      ${common.warnings.length ? `<div class="export-warning"><strong>共通Project変換時の注意</strong><ul class="evidence-list">${common.warnings.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>` : ''}
      <p class="feature-status" data-export-status aria-live="polite"></p>
    </div>
  `;

  const status = root.querySelector('[data-export-status]');

  function payload(kind) {
    if (kind === 'song-project') return { name: `${baseName}_song_project_v1.json`, text: `${JSON.stringify(common.project, null, 2)}\n`, type: 'application/json;charset=utf-8' };
    if (kind === 'json') return { name: `${baseName}_analysis_v0.9.json`, text: exportAnalysisJson(bundle), type: 'application/json;charset=utf-8' };
    if (kind === 'csv') return { name: `${baseName}_analysis_v0.9.csv`, text: exportAnalysisCsv(bundle), type: 'text/csv;charset=utf-8' };
    if (kind === 'markdown') return { name: `${baseName}_report_v0.9.md`, text: exportAnalysisMarkdown(bundle, { metrics, explanation }), type: 'text/markdown;charset=utf-8' };
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
        const item = payload('song-project');
        const file = new File([item.text], item.name, { type: item.type });
        if (navigator.canShare && !navigator.canShare({ files: [file] })) throw new Error('この端末ではファイル共有に対応していません。');
        await navigator.share({ title: 'MIDI Analyzer Export', text: 'Song Project v1', files: [file] });
        status.textContent = '共通Song Projectを端末の共有メニューへ渡しました。';
        return;
      }
      const item = payload(kind);
      if (!item) return;
      downloadText(item.name, item.text, item.type);
      status.textContent = `${item.name} を書き出しました。`;
    } catch (error) {
      status.textContent = `書き出しできませんでした: ${error.message}`;
    }
  });

  return Object.freeze({ songProject: common.project, demoProject: demo.project, warnings: common.warnings });
}
