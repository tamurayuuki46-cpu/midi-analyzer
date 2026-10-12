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
    'compare',
    'library',
    'ai',
    'parts',
  ]);
});

test('ArrowRight and ArrowLeft wrap between tabs', () => {
  assert.equal(getTabIndexForKey(0, 'ArrowLeft', 10), 9);
  assert.equal(getTabIndexForKey(9, 'ArrowRight', 10), 0);
  assert.equal(getTabIndexForKey(4, 'ArrowRight', 10), 5);
});

test('Home and End jump to the first and last tab', () => {
  assert.equal(getTabIndexForKey(5, 'Home', 10), 0);
  assert.equal(getTabIndexForKey(2, 'End', 10), 9);
});
