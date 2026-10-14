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

test('beginner summary reduces analysis to five simple metrics and at most three actions', () => {
  const melody = [60, 62, 64, 65, 67, 69, 71, 72].map((pitch, index) => note(`m${index}`, 'lead', pitch, index * 480));
  const song = makeSong(melody, [track('lead', 'melody', melody.length)]);
  const summary = buildBeginnerSummary(song);

  assert.deepEqual(summary.metrics.map((item) => item.label), ['Key', '音域', '音の動き', 'リズム', '反復']);
  assert.ok(summary.positives.length >= 1);
  assert.ok(summary.improvements.length >= 1);
  assert.ok(summary.nextActions.length >= 1 && summary.nextActions.length <= 3);
});

test('repeated four-note shape is explained as a coherent repetition candidate', () => {
  const pitches = [60, 62, 64, 65, 67, 69, 71, 72];
  const melody = pitches.map((pitch, index) => note(`m${index}`, 'lead', pitch, index * 480));
  const song = makeSong(melody, [track('lead', 'melody', melody.length)]);
  const summary = buildBeginnerSummary(song);
  const repetition = summary.metrics.find((item) => item.id === 'repetition');

  assert.equal(repetition.value, 'まとまりあり');
  assert.ok(summary.positives.some((item) => item.includes('反復')));
});

test('large melody jumps become a concrete beginner improvement suggestion', () => {
  const pitches = [48, 72, 49, 73, 50, 74, 51, 75];
  const melody = pitches.map((pitch, index) => note(`m${index}`, 'lead', pitch, index * 480));
  const song = makeSong(melody, [track('lead', 'melody', melody.length)]);
  const summary = buildBeginnerSummary(song);

  assert.equal(summary.metrics.find((item) => item.id === 'movement').value, 'ジャンプが多め');
  assert.ok(summary.improvements.some((item) => item.includes('音程ジャンプ')));
  assert.ok(summary.nextActions.some((item) => item.includes('跳ぶ')));
});
