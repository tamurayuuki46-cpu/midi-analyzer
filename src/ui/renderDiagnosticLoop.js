import {
  DIAGNOSTIC_INTENTS,
  analyzeIntentDiagnostic,
  buildIntentArrangementHandoff,
} from '../analysis/diagnostic/index.js';

export const INTENT_STORAGE_KEY = 'midi-analyzer:diagnostic-intent:v1';
const HISTORY_STORAGE_KEY = 'midi-analyzer:experiment-history:v1';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function percent(value) {
  return Number.isFinite(value) ? `${Math.round(value * 100)}%` : '—';
}

function safeFileName(value) {
  return String(value || 'midi')
    .replace(/\.(mid|midi)$/i, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'midi';
}

function readLocalStorage(key, fallback) {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeLocalStorage(key, value) {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadIntentId() {
  const stored = readLocalStorage(INTENT_STORAGE_KEY, 'neutral');
  return DIAGNOSTIC_INTENTS.some((item) => item.id === stored) ? stored : 'neutral';
}

function loadHistory() {
  const stored = readLocalStorage(HISTORY_STORAGE_KEY, []);
  return Array.isArray(stored) ? stored.slice(0, 20) : [];
}

function renderSectionComparison(result) {
  const comparison = result?.sectionComparison;
  if (!comparison?.sections?.length) return '<p class="empty-state">Section比較に必要な区間候補がありません。</p>';
  return `
    <div class="advanced-section-grid" data-diagnostic-sections>
      ${comparison.sections.map((section) => `
        <article class="advanced-card">
          <div class="advanced-card-heading">
            <strong>Section ${escapeHtml(section.label)}</strong>
            <span class="status-pill">${section.startBar}–${section.endBar}小節</span>
          </div>
          <p>Note密度 ${section.density ?? '—'} / quarter · Melody音域 ${section.melodyRangeSemitones ?? '—'} st</p>
          <small>Chord Tone ${percent(section.chordToneRatio)} · 着地 ${escapeHtml(section.landingPitchName ?? '—')} (${escapeHtml(section.landingDegree ?? '—')})</small>
        </article>
      `).join('')}
    </div>
    ${comparison.adjacent?.length ? `
      <div class="advanced-card-list">
        ${comparison.adjacent.map((item) => `
          <article class="advanced-card">
            <div class="advanced-card-heading"><strong>${escapeHtml(item.fromLabel)} → ${escapeHtml(item.toLabel)}</strong><span class="status-pill">差分</span></div>
            <p>${escapeHtml(item.meaning)}</p>
          </article>
        `).join('')}
      </div>
    ` : ''}
    <p class="helper-note">${escapeHtml(comparison.note)}</p>
  `;
}

function renderMetricMeanings(result) {
  const items = result?.metricMeanings ?? [];
  if (!items.length) return '<p class="empty-state">意味付けできる分析値が不足しています。</p>';
  return `
    <div class="advanced-card-list" data-diagnostic-meanings>
      ${items.map((item) => `
        <article class="advanced-card">
          <div class="advanced-card-heading"><strong>${escapeHtml(item.title)}</strong><span class="status-pill">Meaning</span></div>
          <p>${escapeHtml(item.meaning)}</p>
          <small>${escapeHtml(item.evidence)}</small>
        </article>
      `).join('')}
    </div>
  `;
}

function renderIntentSelector(diagnostic, intentId) {
  return `
    <label class="diagnostic-intent-field">
      <span>今回の目的</span>
      <select data-diagnostic-intent>
        ${DIAGNOSTIC_INTENTS.map((intent) => `<option value="${escapeHtml(intent.id)}" ${intent.id === intentId ? 'selected' : ''}>${escapeHtml(intent.label)}</option>`).join('')}
      </select>
      <small>${escapeHtml(diagnostic.userIntent?.description ?? '')}</small>
    </label>
  `;
}

function renderExperiment(experiment) {
  if (!experiment) return '';
  return `
    <div class="diagnostic-experiment-detail">
      <p><strong>1項目だけ変更:</strong> ${escapeHtml(experiment.variable)}</p>
      <small><strong>固定するもの:</strong> ${escapeHtml(experiment.keepConstant.join(' / '))}</small>
      <ul>
        ${experiment.choices.map((choice) => `<li>${escapeHtml(choice)}</li>`).join('')}
      </ul>
      <small><strong>再確認:</strong> ${escapeHtml(experiment.verification)}</small>
    </div>
  `;
}

function renderPriorities(result, selectedPriorityId) {
  const items = result?.priorities ?? [];
  if (!items.length) return '<p class="empty-state">見直し候補を作れるEvidenceが不足しています。</p>';
  return `
    <div class="advanced-card-list" data-diagnostic-priorities>
      ${items.map((item) => {
        const selected = item.id === selectedPriorityId;
        return `
          <article class="advanced-card diagnostic-priority-card ${selected ? 'is-selected' : ''}">
            <div class="advanced-card-heading">
              <strong>${item.priority}. ${escapeHtml(item.title)}</strong>
              <span class="status-pill">${selected ? '選択中' : 'Try'}</span>
            </div>
            <p>${escapeHtml(item.meaning)}</p>
            <small>${escapeHtml(item.evidence)}</small>
            <p class="diagnostic-rationale"><strong>なぜ候補?</strong> ${escapeHtml(item.rationale)}</p>
            ${renderExperiment(item.experiment)}
            <button type="button" class="secondary-button diagnostic-select-button" data-select-priority="${escapeHtml(item.id)}" ${selected ? 'aria-pressed="true"' : ''}>${selected ? 'この1項目を試す' : 'これだけ試す'}</button>
          </article>
        `;
      }).join('')}
    </div>
    <p class="helper-note">${escapeHtml(result.note)}</p>
  `;
}

function renderHistory(history) {
  if (!history.length) {
    return '<p class="empty-state">まだ採用・見送りの記録はありません。</p>';
  }
  return `
    <div class="advanced-card-list diagnostic-history-list">
      ${history.slice(0, 5).map((item) => `
        <article class="advanced-card">
          <div class="advanced-card-heading">
            <strong>${escapeHtml(item.title)}</strong>
            <span class="status-pill">${item.decision === 'accepted' ? '採用' : '見送り'}</span>
          </div>
          <p>${escapeHtml(item.intentLabel)}</p>
          <small>${escapeHtml(item.fileName)} · ${escapeHtml(item.recordedAt)}</small>
        </article>
      `).join('')}
    </div>
  `;
}

function downloadJson(payload, fileName) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function transferHandoff(root, handoff, fileName, options = {}) {
  if (typeof options.onArrangementHandoff === 'function') {
    await options.onArrangementHandoff(handoff);
    return 'Arrangement Lab連携先へ、選んだ1項目の提案を渡しました。';
  }

  root.dispatchEvent(new CustomEvent('midi-analyzer:arrangement-handoff', {
    bubbles: true,
    detail: handoff,
  }));

  const file = typeof File === 'function'
    ? new File([JSON.stringify(handoff, null, 2)], fileName, { type: 'application/json' })
    : null;
  if (file && navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Arrangement Lab 提案', text: 'MIDI Analyzerの1項目実験です。' });
    return '共有メニューへ1項目実験を渡しました。';
  }

  downloadJson(handoff, fileName);
  return 'Arrangement Lab用JSONを書き出しました。';
}

export function mountDiagnosticLoop(root, song, options = {}) {
  if (!root) return null;
  let intentId = loadIntentId();
  let diagnostic = analyzeIntentDiagnostic(song, { intentId, analysisOptions: options.analysisOptions ?? {} });
  let selectedPriorityId = diagnostic.priorities?.[0]?.id ?? null;
  let history = loadHistory();
  let status = '';
  let isTransferring = false;

  function selectedPriority() {
    return diagnostic.priorities?.find((item) => item.id === selectedPriorityId) ?? diagnostic.priorities?.[0] ?? null;
  }

  function recompute(nextIntentId) {
    intentId = nextIntentId;
    writeLocalStorage(INTENT_STORAGE_KEY, intentId);
    diagnostic = analyzeIntentDiagnostic(song, { intentId, analysisOptions: options.analysisOptions ?? {} });
    selectedPriorityId = diagnostic.priorities?.[0]?.id ?? null;
    status = '';
  }

  function recordDecision(decision) {
    const selected = selectedPriority();
    if (!selected) return;
    const record = {
      id: `${Date.now()}:${selected.id}`,
      recordedAt: new Date().toLocaleString('ja-JP'),
      fileName: song?.source?.fileName ?? 'untitled.mid',
      intentId: diagnostic.userIntent?.id ?? 'neutral',
      intentLabel: diagnostic.userIntent?.label ?? '特徴を確認したい',
      priorityId: selected.id,
      title: selected.title,
      experimentVariable: selected.experiment?.variable ?? '',
      decision,
    };
    history = [record, ...history].slice(0, 20);
    const saved = writeLocalStorage(HISTORY_STORAGE_KEY, history);
    status = saved
      ? `${decision === 'accepted' ? '採用' : '見送り'}として、この端末の履歴に記録しました。`
      : '履歴を端末へ保存できませんでした。';
  }

  function render() {
    const selected = selectedPriority();
    root.innerHTML = `
      <section class="advanced-subsection diagnostic-intent-section">
        <div class="advanced-subheading"><h3>目的から分析する</h3><span class="status-pill">v0.25</span></div>
        ${renderIntentSelector(diagnostic, intentId)}
        <p class="helper-note">目的は提案の並び順にだけ使います。曲の品質Scoreにはしません。</p>
      </section>
      <section class="advanced-subsection">
        <div class="advanced-subheading"><h3>Section比較</h3><span class="status-pill">Evidence</span></div>
        ${renderSectionComparison(diagnostic)}
      </section>
      <section class="advanced-subsection">
        <div class="advanced-subheading"><h3>分析値の意味</h3><span class="status-pill">Explain</span></div>
        ${renderMetricMeanings(diagnostic)}
      </section>
      <section class="advanced-subsection">
        <div class="advanced-subheading"><h3>目的に合わせた見直し候補 TOP 3</h3><span class="status-pill">1変数ずつ</span></div>
        ${renderPriorities(diagnostic, selected?.id ?? null)}
        <div class="diagnostic-action-row">
          <button type="button" class="primary-button" data-arrangement-handoff ${!selected || isTransferring ? 'disabled' : ''}>選んだ1項目をArrangement Labへ渡す</button>
          <button type="button" class="secondary-button" data-record-decision="accepted" ${!selected ? 'disabled' : ''}>採用として記録</button>
          <button type="button" class="secondary-button" data-record-decision="skipped" ${!selected ? 'disabled' : ''}>見送りとして記録</button>
        </div>
        <p class="helper-note">Arrangement Labで試した後は、Compareの「修正前 → 修正後」で同じ指標を再分析できます。</p>
        ${status ? `<p class="storage-status" data-diagnostic-status>${escapeHtml(status)}</p>` : ''}
      </section>
      <section class="advanced-subsection">
        <div class="advanced-subheading"><h3>実験の採用履歴</h3><span class="status-pill">この端末のみ</span></div>
        ${renderHistory(history)}
        <p class="helper-note">履歴はlocalStorageにだけ保存し、SongProject / IndexedDB Schemaは変更しません。</p>
      </section>
    `;
  }

  root.addEventListener('change', (event) => {
    const select = event.target.closest('[data-diagnostic-intent]');
    if (!select) return;
    recompute(select.value);
    render();
  });

  root.addEventListener('click', async (event) => {
    const priorityButton = event.target.closest('[data-select-priority]');
    if (priorityButton) {
      selectedPriorityId = priorityButton.dataset.selectPriority;
      status = 'この1項目だけを試す実験として選びました。';
      render();
      return;
    }

    const decisionButton = event.target.closest('[data-record-decision]');
    if (decisionButton) {
      recordDecision(decisionButton.dataset.recordDecision);
      render();
      return;
    }

    const handoffButton = event.target.closest('[data-arrangement-handoff]');
    if (!handoffButton || isTransferring) return;
    const selected = selectedPriority();
    if (!selected) return;
    isTransferring = true;
    status = '選んだ1項目の提案を準備中…';
    render();
    try {
      const handoff = buildIntentArrangementHandoff(song, diagnostic, selected.id);
      const fileName = `${safeFileName(song?.source?.fileName)}_arrangement_handoff_v0.25.json`;
      status = await transferHandoff(root, handoff, fileName, options);
    } catch (error) {
      status = `提案を渡せませんでした: ${error.message}`;
    } finally {
      isTransferring = false;
      render();
    }
  });

  render();
  return Object.freeze({
    get diagnostic() { return diagnostic; },
    getHandoff: () => buildIntentArrangementHandoff(song, diagnostic, selectedPriorityId),
    getSelectedPriority: () => selectedPriority(),
  });
}
