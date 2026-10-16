import test from 'node:test';
import assert from 'node:assert/strict';
import { ANALYSIS_TABS, getTabIndexForKey } from '../src/ui/tabModel.js';

test('analysis tab order matches the Analyzer navigation (Library moved to Archive)', () => {
  assert.deepEqual(ANALYSIS_TABS, [
    'overview',
    'harmony',
    'melody',
    'bass',
    'rhythm',
    'structure',
    'visual',
    'compare',
    'export',
    'ai',
    'metrics',
    'parts',
  ]);
});

test('ArrowRight and ArrowLeft wrap between tabs', () => {
  assert.equal(getTabIndexForKey(0, 'ArrowLeft', 12), 11);
  assert.equal(getTabIndexForKey(11, 'ArrowRight', 12), 0);
  assert.equal(getTabIndexForKey(4, 'ArrowRight', 12), 5);
});

test('Home and End jump to the first and last tab', () => {
  assert.equal(getTabIndexForKey(5, 'Home', 12), 0);
  assert.equal(getTabIndexForKey(2, 'End', 12), 11);
});

test('Library is Archive-owned and is not an Analyzer tab', () => {
  assert.equal(ANALYSIS_TABS.includes('library'), false);
});
