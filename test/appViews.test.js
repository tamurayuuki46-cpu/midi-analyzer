import test from 'node:test';
import assert from 'node:assert/strict';
import {
  APP_VIEWS,
  DEFAULT_APP_VIEW,
  defaultSaveForView,
  normalizeAppView,
  resolveInitialView,
  viewFromHash,
} from '../src/ui/appViewModel.js';
import { FOCUS_LIMIT, buildFocusItems, describeAction } from '../src/ui/analyzerFocusModel.js';

test('there are exactly two views and Analyzer is the default', () => {
  assert.deepEqual(APP_VIEWS, ['analyzer', 'archive']);
  assert.equal(DEFAULT_APP_VIEW, 'analyzer');
  assert.equal(normalizeAppView('archive'), 'archive');
  assert.equal(normalizeAppView('library'), 'analyzer');
  assert.equal(normalizeAppView(null), 'analyzer');
});

test('hash wins over stored preference, unknown values fall back safely', () => {
  assert.equal(viewFromHash('#archive'), 'archive');
  assert.equal(viewFromHash('#analyzer'), 'analyzer');
  assert.equal(viewFromHash('#archive-x'), null);
  assert.equal(viewFromHash(''), null);
  assert.equal(resolveInitialView({ hash: '#archive', stored: 'analyzer' }), 'archive');
  assert.equal(resolveInitialView({ hash: '', stored: 'archive' }), 'archive');
  assert.equal(resolveInitialView({ hash: '#nope', stored: 'garbage' }), 'analyzer');
  assert.equal(resolveInitialView(), 'analyzer');
});

test('Archive saves by default, Analyzer does not persist anything unless asked', () => {
  assert.equal(defaultSaveForView('archive'), true);
  assert.equal(defaultSaveForView('analyzer'), false);
  assert.equal(defaultSaveForView('anything-else'), false);
});

const priority = (n) => ({
  id: `p${n}`,
  priority: n,
  title: `title ${n}`,
  evidence: `evidence ${n}`,
  meaning: `meaning ${n}`,
  experiment: { variable: `var-${n}`, keepConstant: ['Melody', 'Tempo'] },
});

test('focus shows at most three items in the order given by the intent-aware diagnostic', () => {
  const items = buildFocusItems({ priorities: [1, 2, 3, 4, 5].map(priority) });
  assert.equal(FOCUS_LIMIT, 3);
  assert.equal(items.length, 3);
  assert.deepEqual(items.map((item) => item.id), ['p1', 'p2', 'p3']);
  assert.deepEqual(items.map((item) => item.rank), [1, 2, 3]);
  assert.equal(items[0].variable, 'var-1');
});

test('focus tolerates missing evidence and never invents items', () => {
  assert.deepEqual(buildFocusItems(null), []);
  assert.deepEqual(buildFocusItems({}), []);
  assert.deepEqual(buildFocusItems({ priorities: [] }), []);
  const [item] = buildFocusItems({ priorities: [{ id: 'x', title: 't' }] });
  assert.equal(item.variable, '');
  assert.deepEqual(item.keepConstant, []);
});

test('focus action is a proposal to try one variable, never a verdict', () => {
  const [item] = buildFocusItems({ priorities: [priority(1)] });
  const text = describeAction(item);
  assert.match(text, /title 1/);
  assert.match(text, /Melody \/ Tempo/);
  assert.doesNotMatch(text, /悪い|良い|直すべき|間違/);
  assert.match(describeAction({ variable: '着地Degree', title: 't', keepConstant: [] }), /着地Degree/);
  assert.match(describeAction({ variable: '', keepConstant: [] }), /別案/);
});
