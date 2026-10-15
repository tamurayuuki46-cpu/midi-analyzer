import './noteFunctionAnalysis.css';
import { analyzeChords, getDefaultChordTrackIds } from '../analysis/chord/index.js';
import { analyzeNoteFunctions } from '../analysis/note-function/index.js';

let active = null;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function percent(value, evaluated) {
  if (!evaluated || !Number.isFinite(value)) return '—';
  return `${Math.round(value * 100)}%`;
}

function metric(label, value, detail = '') {
  return `
    <div class="basic-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      ${detail ? `<small>${escapeHtml(detail)}</small>` : ''}
    </div>
  `;
}

function currentMelodyTrackId() {
  return document.querySelector('[data-basic-melody-track]')?.value ?? null;
}

function currentChordSegments(song) {
  const checkedTrackIds = [...document.querySelectorAll('[data-chord-track]:checked')]
    .map((input) => input.dataset.chordTrack)
    .filter(Boolean);
  const trackIds = checkedTrackIds.length ? checkedTrackIds : [...getDefaultChordTrackIds(song)];
  const result = analyzeChords(song, { trackIds });
  const selectedBySegment = new Map(
    [...document.querySelectorAll('[data-chord-segment][data-chord-value][aria-pressed="true"]')]
      .map((button) => [button.dataset.chordSegment, button.dataset.chordValue]),
  );

  return result.segments.map((segment) => {
    const selected = selectedBySegment.get(segment.id) ?? null;
    const selectedCandidate = selected
      ? segment.candidates.find((candidate) => candidate.value === selected) ?? null
      : null;
    return {
      ...segment,
      selected,
      selectedCandidate,
      effectiveCandidate: selectedCandidate ?? segment.candidates[0] ?? null,
      selectionSource: selectedCandidate ? 'selected' : 'candidate',
    };
  });
}

function ensureDetailPanel() {
  const melodyRoot = document.querySelector('[data-basic-melody-root]');
  const melodyPanel = melodyRoot?.closest('.panel');
  if (!melodyPanel) return null;

  let panel = document.querySelector('[data-note-function-panel]');
  if (!panel) {
    panel = document.createElement('section');
    panel.className = 'panel note-function-panel';
    panel.dataset.noteFunctionPanel = '';
    panel.setAttribute('aria-labelledby', 'note-function-title');
    panel.innerHTML = `
      <div class="panel-heading">
        <div><p class="eyebrow">NOTE FUNCTION</p><h2 id="note-function-title">Chord ToneとScale Tone</h2></div>
        <span class="status-pill">v0.20</span>
      </div>
      <div data-note-function-root></div>
    `;
    melodyPanel.after(panel);
  }
  return panel.querySelector('[data-note-function-root]');
}

function relationshipMeaning(result) {
  const relation = result.relationship;
  if (!relation.evaluated) {
    return result.scaleTone.evaluated
      ? 'Scale Toneは現在のKey候補との関係です。Chord区間が取れない場所ではChord Toneとの組み合わせを断定しません。'
      : 'Key / Scale候補がないため、音階内外の判定を保留しています。';
  }
  const parts = [];
  if (relation.scaleOnly) parts.push(`コード外だがスケール内 ${relation.scaleOnly}音`);
  if (relation.chordOnly) parts.push(`コード内だが現在のスケール基準では外側 ${relation.chordOnly}音`);
  if (relation.outsideBoth) parts.push(`両方の外側 ${relation.outsideBoth}音`);
  return parts.length
    ? `${parts.join(' / ')}。どれも誤り判定ではなく、緊張・経過・色付けを確認するための観測値です。`
    : '判定できた範囲では、Chord ToneとScale Toneの両方に含まれる音が中心です。';
}

function renderDetail(result) {
  const root = ensureDetailPanel();
  if (!root) return;
  if (!result.noteCount) {
    root.innerHTML = '<p class="empty-state">Melody分析に使えるNoteがありません。</p>';
    return;
  }

  const scale = result.scaleTone;
  const chord = result.chordTone;
  const relation = result.relationship;
  const keyContext = result.key
    ? `${result.key.value}（${result.key.source === 'selected' ? '選択Key' : 'Key候補'}）`
    : 'Key候補なし';

  root.innerHTML = `
    <p class="note-function-context">Key基準: <strong>${escapeHtml(keyContext)}</strong>。ChordはHarmonyタブの現在のTrack・候補選択を使います。</p>
    <div class="basic-metric-grid">
      ${metric('Scale Tone', percent(scale.ratio, scale.evaluated), scale.evaluated ? `${scale.tone}/${scale.evaluated} · Scale外 ${scale.nonScaleTone}` : 'Key候補なし')}
      ${metric('Chord Tone', percent(chord.ratio, chord.evaluated), chord.evaluated ? `${chord.tone}/${chord.evaluated} · Chord外 ${chord.nonChordTone}` : 'Chord区間なし')}
      ${metric('Chord外・Scale内', `${relation.scaleOnly}音`, relation.evaluated ? `${relation.evaluated}音を両方の基準で比較` : '比較保留')}
      ${metric('Chord内・Scale外', `${relation.chordOnly}音`, '借用和音・7th等でも起こり得ます')}
      ${metric('両方の外側', `${relation.outsideBoth}音`, '経過音・アプローチ等の候補として観察')}
    </div>
    ${chord.provisionalCount ? `<p class="note-function-assumption">Chord未選択区間では第1候補を仮使用しています（${chord.provisionalCount}発音）。HarmonyでChordを選ぶと再計算します。</p>` : ''}
    <div class="note-function-legend">
      <article><strong>Chord Tone</strong><small>その瞬間のChord構成音に含まれるかを見る。</small></article>
      <article><strong>Scale Tone</strong><small>現在のKey / Scaleの音階内に含まれるかを見る。</small></article>
      <article><strong>Chord外・Scale内</strong><small>コード構成音ではないが、Keyの音階には含まれる音。</small></article>
      <article><strong>Chord内・Scale外</strong><small>Chordには含まれるが、現在のKey候補の基本音階からは外れる音。</small></article>
    </div>
    <p class="note-function-help">${escapeHtml(relationshipMeaning(result))}</p>
    <p class="helper-note">${escapeHtml(result.note)}</p>
  `;
}

function beginnerActions(result) {
  const actions = [];
  if (result.relationship.scaleOnly) actions.push('コード外・Scale内の音が次のChord Toneへどう動くか聴く');
  if (result.relationship.chordOnly) actions.push('Chord内・Scale外の音が和音の色として聞こえる箇所を確認する');
  if (result.relationship.outsideBoth) actions.push('両方の外側の音を外す案と残す案をA/Bで比べる');
  if (!actions.length) actions.push('Chord ToneとScale Toneの違いを詳細モードで確認する');
  return actions.slice(0, 2);
}

function renderBeginner(result) {
  const grid = document.querySelector('.beginner-metric-grid');
  if (!grid) return;
  grid.querySelector('[data-beginner-metric="note-function"]')?.remove();

  const card = document.createElement('article');
  card.className = 'beginner-metric-card';
  card.dataset.beginnerMetric = 'note-function';
  const scaleValue = percent(result.scaleTone.ratio, result.scaleTone.evaluated);
  const chordValue = percent(result.chordTone.ratio, result.chordTone.evaluated);
  const actions = beginnerActions(result);
  card.innerHTML = `
    <span class="metric-kicker">Metric</span>
    <strong>音の役割: Scale ${escapeHtml(scaleValue)} / Chord ${escapeHtml(chordValue)}</strong>
    <small>Chord ToneとScale Toneを別々に数えています</small>
    <div class="metric-meaning"><span>Meaning</span><p>${escapeHtml(relationshipMeaning(result))}</p></div>
    <div class="metric-actions"><span>Action</span><ul>${actions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>
  `;
  grid.append(card);
}

function renderCurrent() {
  if (!active?.song) return;
  const result = analyzeNoteFunctions(active.song, {
    trackId: currentMelodyTrackId(),
    keyValue: active.keyValue,
    keySource: active.keySource,
    chordSegments: currentChordSegments(active.song),
  });
  renderDetail(result);
  renderBeginner(result);
}

window.addEventListener('midi-analyzer-song-ready', (event) => {
  const song = event.detail?.song;
  if (!song) return;
  active = {
    song,
    keyValue: event.detail?.detectedKey ?? null,
    keySource: 'candidate',
  };
  renderCurrent();
});

document.addEventListener('key-selection-change', (event) => {
  if (!active) return;
  active.keyValue = event.detail?.selected ?? active.keyValue;
  active.keySource = 'selected';
  renderCurrent();
});

document.addEventListener('chord-selection-change', renderCurrent);
document.addEventListener('chord-analysis-change', renderCurrent);
document.addEventListener('change', (event) => {
  if (event.target.closest('[data-basic-melody-track]')) renderCurrent();
});
