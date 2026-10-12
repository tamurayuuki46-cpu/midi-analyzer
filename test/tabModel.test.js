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
    'recorder',
    'export',
    'ai',
    'metrics',
    'parts',
  ]);
});

test('ArrowRight and ArrowLeft wrap between tabs', () => {
  assert.equal(getTabIndexForKey(0, 'ArrowLeft', 14), 13);
  assert.equal(getTabIndexForKey(13, 'ArrowRight', 14), 0);
  assert.equal(getTabIndexForKey(4, 'ArrowRight', 14), 5);
});

test('Home and End jump to the first and last tab', () => {
  assert.equal(getTabIndexForKey(5, 'Home', 14), 0);
  assert.equal(getTabIndexForKey(2, 'End', 14), 13);
});
