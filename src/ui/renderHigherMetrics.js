import './postV07Features.css';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function mountHigherMetrics(root, result) {
  if (!root) return null;
  const metrics = result?.metrics ?? [];
  root.innerHTML = `
    <div class="feature-stack">
      <p class="feature-note">0〜100は候補Scoreです。品質・人気・正解を採点するものではなく、MIDI特徴量を比較しやすくするための指標です。</p>
      ${metrics.map((metric) => `
        <article class="metric-card">
          <div class="metric-head"><h3>${escapeHtml(metric.label)}</h3><span class="metric-score">${metric.score}/100</span></div>
          <div class="metric-bar" aria-hidden="true"><span style="width:${Math.max(0, Math.min(100, metric.score))}%"></span></div>
          <p>${escapeHtml(metric.summary)}</p>
          ${metric.evidence?.length ? `<ul class="evidence-list">${metric.evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
        </article>
      `).join('')}
      <article class="metric-card">
        <h3>Section別 サビらしさ候補</h3>
        <div class="chorus-table">
          ${(result?.chorusCandidates ?? []).map((item) => `<div class="chorus-row"><span>${escapeHtml(item.label)} · ${item.startBar}-${item.endBar}小節</span><strong>${item.score}/100</strong></div>`).join('') || '<p>Section候補なし</p>'}
        </div>
      </article>
      <p class="feature-note">${escapeHtml(result?.note ?? '')}</p>
    </div>
  `;
  return Object.freeze({ metrics });
}
