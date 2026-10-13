export const ANALYSIS_TABS = Object.freeze([
  'overview',
  'harmony',
  'melody',
  'bass',
  'rhythm',
  'structure',
  'visual',
  'compare',
  'library',
  'export',
  'ai',
  'metrics',
  'parts',
]);

export function getTabIndexForKey(currentIndex, key, count) {
  if (!Number.isInteger(currentIndex) || !Number.isInteger(count) || count <= 0) return currentIndex;
  if (key === 'ArrowRight') return (currentIndex + 1) % count;
  if (key === 'ArrowLeft') return (currentIndex - 1 + count) % count;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  return currentIndex;
}
