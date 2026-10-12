import './postV07Features.css';
import { buildAiPrompt } from '../analysis/explanation/index.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function mountAiExplanation(panel, bundle, explanation) {
  if (!panel) return null;
  const prompt = buildAiPrompt(bundle, explanation);
  panel.innerHTML = `
    <section class="panel" aria-labelledby="ai-title">
      <div class="panel-heading"><div><p class="eyebrow">AI EXPLANATION</p><h2 id="ai-title">この曲から学べること</h2></div><span class="status-pill">v0.8</span></div>
      <div class="feature-stack">
        <div><span class="ai-local-badge">端末内Explainability</span><p class="feature-note">外部AIへMIDIを送信せず、既存Analyzerの根拠を自然言語化します。生成AIによる断定ではありません。</p></div>
        <article class="explain-card"><h3>概要</h3><p>${escapeHtml(explanation.overview)}</p></article>
        <article class="explain-card"><h3>なぜこのKey候補？</h3><p>${escapeHtml(explanation.whyKey)}</p></article>
        <article class="explain-card"><h3>Chordの読み方</h3><p>${escapeHtml(explanation.harmony)}</p></article>
        <article class="explain-card"><h3>転調候補の読み方</h3><p>${escapeHtml(explanation.modulation)}</p></article>
        <article class="explain-card"><h3>この曲から学べること</h3><ul class="learning-list">${explanation.learnings.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article>
        <article class="explain-card"><h3>作曲へ応用する候補</h3><ul class="learning-list">${explanation.applications.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article>
        <article class="explain-card"><h3>外部AIへ渡す場合のPrompt</h3><p class="feature-note">必要な場合だけ、このPromptをファイルとして保存してChatGPT等へ渡せます。自動送信はしません。</p><div class="feature-actions"><button class="feature-button" type="button" data-save-ai-prompt>AI Promptを保存</button></div></article>
        <p class="feature-status" data-ai-status aria-live="polite"></p>
      </div>
    </section>
  `;

  const status = panel.querySelector('[data-ai-status]');
  panel.querySelector('[data-save-ai-prompt]')?.addEventListener('click', () => {
    const blob = new Blob([prompt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'midi_analyzer_ai_prompt.txt';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    status.textContent = 'AI Promptを保存しました。';
  });

  return Object.freeze({ prompt });
}
