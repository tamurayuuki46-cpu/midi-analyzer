function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function mountKeyAnalysis(root, result) {
  if (!root) return null;
  let selected = result.selected ?? null;

  function render() {
    if (!result.candidates.length) {
      root.innerHTML = `<p class="empty-state">${escapeHtml(result.note)}</p>`;
      return;
    }

    root.innerHTML = `
      <div class="key-candidate-list">
        ${result.candidates.map((candidate, index) => `
          <article class="key-candidate-card${selected === candidate.value ? ' is-selected' : ''}">
            <div>
              <p class="key-rank">候補 ${index + 1}</p>
              <strong>${escapeHtml(candidate.value)}</strong>
              <small>一致度 ${(candidate.confidence * 100).toFixed(0)}%</small>
            </div>
            <button
              type="button"
              class="candidate-button"
              data-key-candidate="${escapeHtml(candidate.value)}"
              aria-pressed="${selected === candidate.value ? 'true' : 'false'}"
            >${selected === candidate.value ? '選択中' : 'この候補を選ぶ'}</button>
          </article>
        `).join('')}
      </div>
      <p class="helper-note">${escapeHtml(result.note)}</p>
      ${result.hint ? `<p class="key-hint">${escapeHtml(result.hint)}</p>` : ''}
      <p class="key-selected-status">${selected ? `選択中: ${escapeHtml(selected)}` : 'まだKey / Scaleは確定していません。必要なら候補を選んでください。'}</p>
    `;
  }

  root.addEventListener('click', (event) => {
    const button = event.target.closest('[data-key-candidate]');
    if (!button) return;
    selected = button.dataset.keyCandidate;
    render();
    root.dispatchEvent(new CustomEvent('key-selection-change', {
      bubbles: true,
      detail: { selected },
    }));
  });

  render();
  return Object.freeze({
    getSelected: () => selected,
    getEffectiveKey: () => selected ?? result.candidates[0]?.value ?? null,
  });
}
