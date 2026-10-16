// "今見る3つ": the Analyzer main screen shows at most three items.
// The items are the existing v0.25 Intent-aware review priorities (already ordered by the
// chosen intent). No new scoring is introduced and nothing is judged good or bad.

export const FOCUS_LIMIT = 3;

export function buildFocusItems(diagnostic, limit = FOCUS_LIMIT) {
  const priorities = Array.isArray(diagnostic?.priorities) ? diagnostic.priorities : [];
  return priorities.slice(0, Math.max(0, limit)).map((item, index) => ({
    id: String(item.id ?? `focus-${index + 1}`),
    rank: index + 1,
    title: String(item.title ?? ''),
    evidence: String(item.evidence ?? ''),
    meaning: String(item.meaning ?? ''),
    variable: String(item.experiment?.variable ?? ''),
    keepConstant: Array.isArray(item.experiment?.keepConstant) ? item.experiment.keepConstant.map(String) : [],
  }));
}

export function describeAction(item) {
  // Internal ids such as "section-landing" are not reader-facing; fall back to the title.
  const readable = item?.variable && !/^[\x21-\x7e]+$/.test(item.variable);
  const label = readable ? item.variable : item?.title;
  if (!label) return '元の曲は変えず、気になった点だけ別案で試してみる。';
  const keep = item.keepConstant.length ? `${item.keepConstant.join(' / ')}は変えずに、` : '';
  return `${keep}「${label}」だけを変えた別案を作って聴き比べる。`;
}
