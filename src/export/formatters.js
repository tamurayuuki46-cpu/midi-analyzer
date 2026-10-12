import { degreeForPitchClass } from '../analysis/chord/index.js';

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function keyValue(bundle) {
  return bundle?.key?.candidates?.[0]?.value ?? '';
}

export function exportAnalysisJson(bundle) {
  return JSON.stringify({ format: 'midi-analyzer-analysis', version: 'v0.9-dev', analysis: bundle }, null, 2);
}

export function exportAnalysisCsv(bundle) {
  const rows = [['category', 'index', 'bar', 'startTick', 'endTick', 'label', 'value', 'confidence', 'detail']];
  (bundle?.key?.candidates ?? []).forEach((candidate, index) => rows.push([
    'key', index + 1, '', '', '', 'Key/Scale', candidate.value, candidate.confidence, '',
  ]));
  (bundle?.chords?.segments ?? []).forEach((segment, index) => {
    const candidate = segment.effectiveCandidate ?? segment.candidates?.[0] ?? null;
    if (!candidate) return;
    const degree = degreeForPitchClass(candidate.root, keyValue(bundle));
    rows.push(['chord', index + 1, segment.barNumber, segment.startTick, segment.endTick, candidate.value, degree?.value ?? '', candidate.confidence, degree?.outOfScale ? 'out-of-scale candidate' : '']);
  });
  (bundle?.structure?.sections ?? []).forEach((section, index) => rows.push([
    'section', index + 1, `${section.startBar}-${section.endBar}`, section.startTick, section.endTick, section.label, section.similarity, '', `density=${section.metrics?.density ?? ''};velocity=${section.metrics?.averageVelocity ?? ''}`,
  ]));
  (bundle?.structure?.modulations ?? []).forEach((item, index) => rows.push([
    'modulation', index + 1, item.atBar, '', '', `${item.from} -> ${item.to}`, item.relation, item.confidence, '',
  ]));
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}

export function exportChordDegreeText(bundle) {
  const key = keyValue(bundle);
  const lines = [`Key候補: ${key || '—'}`, ''];
  for (const segment of bundle?.chords?.segments ?? []) {
    const candidate = segment.effectiveCandidate ?? segment.candidates?.[0] ?? null;
    if (!candidate) continue;
    const degree = degreeForPitchClass(candidate.root, key);
    const bar = segment.barNumber ? `Bar ${segment.barNumber}` : `${segment.startTick}-${segment.endTick}`;
    lines.push(`${bar}: ${candidate.value}  ${degree?.value ?? '—'}${degree?.outOfScale ? ' (音階外候補)' : ''}`);
  }
  if (lines.length === 2) lines.push('Chord候補なし');
  return lines.join('\n');
}

export function exportAnalysisMarkdown(bundle, extras = {}) {
  const key = bundle?.key?.candidates?.[0] ?? null;
  const progression = (bundle?.topChordProgression ?? []).map((item) => item.value).filter(Boolean).join(' → ');
  const sections = (bundle?.structure?.sections ?? []).map((section) => `${section.label} (${section.startBar}-${section.endBar}小節)`).join(' / ');
  const mods = (bundle?.structure?.modulations ?? []).map((item) => `Bar ${item.atBar}: ${item.from} → ${item.to} (${item.relation})`).join('\n- ');
  const metrics = extras.metrics?.metrics ?? [];
  const learnings = extras.explanation?.learnings ?? [];
  const applications = extras.explanation?.applications ?? [];

  return [
    '# MIDI Analyzer Report',
    '',
    `- Source: ${bundle?.source?.fileName ?? 'untitled.mid'}`,
    `- BPM: ${bundle?.song?.tempo ?? '—'}`,
    `- Key candidate: ${key?.value ?? '—'}${key ? ` (${Math.round((key.confidence ?? 0) * 100)}%)` : ''}`,
    `- Tracks: ${bundle?.song?.trackCount ?? 0}`,
    `- Notes: ${bundle?.song?.noteCount ?? 0}`,
    '',
    '## Chord progression (Top 1 candidates)',
    progression || '候補なし',
    '',
    '## Structure candidates',
    sections || '候補なし',
    '',
    '## Modulation candidates',
    mods ? `- ${mods}` : '候補なし',
    '',
    '## Higher-level metrics',
    ...(metrics.length ? metrics.map((metric) => `- **${metric.label}**: ${metric.score}/100 — ${metric.summary}`) : ['未計算']),
    '',
    '## この曲から学べること',
    ...(learnings.length ? learnings.map((item) => `- ${item}`) : ['未計算']),
    '',
    '## 作曲へ応用する候補',
    ...(applications.length ? applications.map((item) => `- ${item}`) : ['未計算']),
    '',
    '> 解析結果はMIDIから得た候補です。音楽的な正解・良し悪しを自動確定するものではありません。',
  ].join('\n');
}
