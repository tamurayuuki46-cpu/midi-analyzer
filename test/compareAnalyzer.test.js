import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzePersonalTrend, compareSongs, summarizeSongForCompare } from '../src/analysis/compare/index.js';

function makeSong({ name = 'song.mid', root = 60, bpm = 120, melodySpread = 0 } = {}) {
  const ppq = 480;
  const barTicks = ppq * 4;
  const notes = [];
  const chordPitches = [root, root + 4, root + 7];
  const melodyPitches = [root + 12, root + 14, root + 16 + melodySpread, root + 19 + melodySpread];

  for (let bar = 0; bar < 4; bar += 1) {
    const barStart = bar * barTicks;
    chordPitches.forEach((pitch, index) => {
      notes.push({ id: `c-${bar}-${index}`, pitch, startTick: barStart, durationTick: barTicks, velocity: 90, trackId: 'chord', channel: 0 });
    });
    notes.push({ id: `b-${bar}`, pitch: root - 12, startTick: barStart, durationTick: barTicks, velocity: 100, trackId: 'bass', channel: 1 });
    melodyPitches.forEach((pitch, index) => {
      notes.push({ id: `m-${bar}-${index}`, pitch, startTick: barStart + index * ppq, durationTick: ppq, velocity: 100, trackId: 'melody', channel: 2 });
    });
    [36, 42, 38, 42].forEach((pitch, index) => {
      notes.push({ id: `d-${bar}-${index}`, pitch, startTick: barStart + index * ppq, durationTick: 120, velocity: 110, trackId: 'drums', channel: 9 });
    });
  }

  return {
    ppq,
    lengthTicks: barTicks * 4,
    source: { fileName: name },
    tempoMap: [{ tick: 0, bpm }],
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
    tracks: [
      { id: 'chord', name: 'Chords', noteCount: 12, isDrums: false, roleHint: 'chord', channels: [0] },
      { id: 'bass', name: 'Bass', noteCount: 4, isDrums: false, roleHint: 'bass', channels: [1] },
      { id: 'melody', name: 'Melody', noteCount: 16, isDrums: false, roleHint: 'melody', channels: [2] },
      { id: 'drums', name: 'Drums', noteCount: 16, isDrums: true, roleHint: 'drums', channels: [9] },
    ],
    notes,
  };
}

test('summarizeSongForCompare exposes key, chord and part metrics', () => {
  const summary = summarizeSongForCompare(makeSong());
  assert.ok(summary.key);
  assert.ok(summary.chordProgression.length >= 1);
  assert.ok(summary.melodyRange > 0);
  assert.ok(summary.rhythmOnsetsPerQuarter > 0);
});

test('compareSongs reports zero deltas for identical songs and keeps neutral explanations', () => {
  const song = makeSong();
  const result = compareSongs(song, song);
  assert.equal(result.sameTopKey, true);
  assert.equal(result.chordSimilarity, 1);
  assert.equal(result.metrics.melodyRange.delta, 0);
  assert.equal(result.metrics.noteDensity.delta, 0);
  assert.ok(result.differenceInsights.length > 0);
  assert.ok(result.differenceInsights.length <= 5);
  assert.match(result.note, /優劣として評価しません/);
});

test('compareSongs explains the largest differences between reference and own song', () => {
  const reference = makeSong({ name: 'reference.mid', root: 62, melodySpread: 0 });
  const own = makeSong({ name: 'own.mid', root: 60, melodySpread: 7 });
  const result = compareSongs(reference, own);
  assert.equal(result.reference.name, 'reference.mid');
  assert.equal(result.own.name, 'own.mid');
  assert.ok(result.differenceInsights.length > 0);
  assert.ok(result.differenceInsights.some((item) => item.id === 'key'));
  assert.ok(result.differenceInsights.some((item) => item.id === 'melody-range'));
  for (const item of result.differenceInsights) {
    assert.ok(item.title);
    assert.ok(item.evidence);
    assert.ok(item.meaning);
    assert.equal(Object.hasOwn(item, 'weight'), false);
  }
  assert.match(result.note, /優劣として評価しません/);
});

test('analyzePersonalTrend aggregates saved songs', () => {
  const result = analyzePersonalTrend([
    makeSong({ name: 'a.mid', bpm: 120 }),
    makeSong({ name: 'b.mid', bpm: 100 }),
  ]);
  assert.equal(result.count, 2);
  assert.equal(result.trend.averageBpm, 110);
  assert.ok(result.trend.commonKey?.value);
  assert.ok(Number.isFinite(result.trend.averageMelodyRange));
});

test('analyzePersonalTrend returns an empty result for no songs', () => {
  const result = analyzePersonalTrend([]);
  assert.equal(result.count, 0);
  assert.equal(result.trend, null);
});
