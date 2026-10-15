import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBeginnerSummary } from '../src/analysis/beginner/index.js';

function track(id, roleHint, noteCount, { isDrums = false } = {}) {
  return { id, name: id, roleHint, noteCount, isDrums, channels: isDrums ? [9] : [0] };
}

function note(id, trackId, pitch, startTick, durationTick = 240, velocity = 100, channel = 0) {
  return { id, trackId, pitch, startTick, durationTick, velocity, channel };
}

function makeSong(notes, tracks, lengthTicks = 3840) {
  return {
    ppq: 480,
    lengthTicks,
    source: { fileName: 'beginner-test.mid', origin: 'midi' },
    tempoMap: [{ tick: 0, bpm: 120 }],
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
    tracks,
    notes,
  };
}

test('beginner summary exposes Metric -> Meaning -> Action without grading', () => {
  const melody = [60, 62, 64, 65, 67, 69, 71, 72].map((pitch, index) => note(`m${index}`, 'lead', pitch, index * 480));
  const song = makeSong(melody, [track('lead', 'melody', melody.length)]);
  const summary = buildBeginnerSummary(song);

  assert.deepEqual(summary.metrics.map((item) => item.label), ['Key', '音域', '音の動き', 'リズム', '反復']);
  assert.ok(summary.metrics.every((item) => typeof item.meaning === 'string' && item.meaning.length > 0));
  assert.ok(summary.metrics.every((item) => Array.isArray(item.actions)));
  assert.ok(summary.nextActions.length >= 1 && summary.nextActions.length <= 3);
  assert.ok(summary.referenceInsights.length >= 4);

  const text = [
    ...summary.metrics.flatMap((item) => [item.meaning, ...(item.actions ?? [])]),
    ...summary.nextActions,
  ].join('\n');
  assert.doesNotMatch(text, /悪い曲|良い曲|不正解|正解です/);
});

test('repeated four-note shape is treated as a feature, not a score', () => {
  const pitches = [60, 62, 64, 65, 67, 69, 71, 72];
  const melody = pitches.map((pitch, index) => note(`m${index}`, 'lead', pitch, index * 480));
  const song = makeSong(melody, [track('lead', 'melody', melody.length)]);
  const summary = buildBeginnerSummary(song);
  const repetition = summary.metrics.find((item) => item.id === 'repetition');

  assert.equal(repetition.value, '反復候補あり');
  assert.match(repetition.meaning, /モチーフ|反復|まとまり/);
  assert.ok(repetition.actions.length >= 1);
});

test('large melody jumps produce an optional comparison action', () => {
  const pitches = [48, 72, 49, 73, 50, 74, 51, 75];
  const melody = pitches.map((pitch, index) => note(`m${index}`, 'lead', pitch, index * 480));
  const song = makeSong(melody, [track('lead', 'melody', melody.length)]);
  const summary = buildBeginnerSummary(song);
  const movement = summary.metrics.find((item) => item.id === 'movement');

  assert.equal(movement.value, 'ジャンプが多め');
  assert.match(movement.meaning, /跳躍/);
  assert.ok(movement.actions.some((item) => /跳ぶ|跳躍|比較/.test(item)));
  assert.ok(summary.nextActions.some((item) => /跳ぶ|跳躍|比較/.test(item)));
});

test('reference insights stay abstract instead of copying note or chord sequences', () => {
  const melody = [60, 62, 64, 65, 67, 69, 71, 72].map((pitch, index) => note(`m${index}`, 'lead', pitch, index * 480));
  const song = makeSong(melody, [track('lead', 'melody', melody.length)]);
  const summary = buildBeginnerSummary(song);
  const referenceText = summary.referenceInsights.map((item) => `${item.label} ${item.trait} ${item.action}`).join('\n');

  assert.match(referenceText, /具体的な音程ではなく|具体的なNote列ではなく|コピーせず/);
  assert.match(referenceText, /自分の曲|試す|傾向/);
});
