import test from 'node:test';
import assert from 'node:assert/strict';
import { ANALYSIS_TABS, getTabIndexForKey } from '../src/ui/tabModel.js';

test('analysis tab order matches the category navigation', () => {
  assert.deepEqual(ANALYSIS_TABS, [
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
});

test('ArrowRight and ArrowLeft wrap between tabs', () => {
  assert.equal(getTabIndexForKey(0, 'ArrowLeft', 13), 12);
  assert.equal(getTabIndexForKey(12, 'ArrowRight', 13), 0);
  assert.equal(getTabIndexForKey(4, 'ArrowRight', 13), 5);
});

test('Home and End jump to the first and last tab', () => {
  assert.equal(getTabIndexForKey(5, 'Home', 13), 0);
  assert.equal(getTabIndexForKey(2, 'End', 13), 12);
});
