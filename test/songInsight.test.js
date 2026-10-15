import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSongInsights } from '../src/analysis/insight/index.js';

function melodyNote(id, pitch, startTick, durationTick = 360, velocity = 96) {
  return { id, pitch, startTick, durationTick, velocity, trackId: 'melody', channel: 0 };
}

function chordNote(id, pitch, startTick, durationTick) {
  return { id, pitch, startTick, durationTick, velocity: 80, trackId: 'chord', channel: 1 };
}

function makeInsightSong() {
  const ppq = 480;
  const barTicks = ppq * 4;
  const firstEnd = barTicks * 4;
  const songEnd = barTicks * 8;
  const notes = [
    melodyNote('m1', 60, 0),
    melodyNote('m2', 62, 960),
    melodyNote('m3', 64, 1920),
    melodyNote('m4', 67, 3840),
    melodyNote('m5', 69, 5760),
    melodyNote('m6', 64, firstEnd - 480, 240, 104),
    melodyNote('m7', 65, firstEnd + 240),
    melodyNote('m8', 67, firstEnd + 1440),
    melodyNote('m9', 72, firstEnd + 2880, 360, 127),
    melodyNote('m10', 69, firstEnd + 4560),
    melodyNote('m11', 67, songEnd - 480, 240, 110),
  ];
  [60, 64, 67].forEach((pitch, index) => notes.push(chordNote(`c1-${index}`, pitch, 0, firstEnd)));
  [65, 69, 72].forEach((pitch, index) => notes.push(chordNote(`c2-${index}`, pitch, firstEnd, songEnd - firstEnd)));
  return {
    ppq,
    lengthTicks: songEnd,
    source: { fileName: 'insight.mid' },
    tempoMap: [{ tick: 0, bpm: 120 }],
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
    tracks: [
      { id: 'melody', name: 'Melody', noteCount: 11, isDrums: false, roleHint: 'melody', channels: [0] },
      { id: 'chord', name: 'Chord', noteCount: 6, isDrums: false, roleHint: 'chord', channels: [1] },
    ],
    notes,
  };
}

function insightOptions() {
  const firstEnd = 480 * 4 * 4;
  const songEnd = 480 * 4 * 8;
  return {
    trackId: 'melody',
    keyValue: 'C major',
    structure: {
      sections: [
        { id: 'block-1', label: 'A', startBar: 1, endBar: 4, startTick: 0, endTick: firstEnd, similarity: 1, metrics: { noteCount: 6, density: 0.75, averagePitch: 64.3, averageVelocity: 100 } },
        { id: 'block-2', label: 'B', startBar: 5, endBar: 8, startTick: firstEnd, endTick: songEnd, similarity: 0.5, metrics: { noteCount: 5, density: 1.5, averagePitch: 68, averageVelocity: 105 } },
      ],
      keyTimeline: [],
      modulations: [],
    },
    chordSegments: [
      { startTick: 0, endTick: firstEnd, candidates: [{ value: 'C major', root: 0, quality: 'major' }], effectiveCandidate: { value: 'C major', root: 0, quality: 'major' } },
      { startTick: firstEnd, endTick: songEnd, candidates: [{ value: 'F major', root: 5, quality: 'major' }], effectiveCandidate: { value: 'F major', root: 5, quality: 'major' } },
    ],
  };
}

test('v0.23 phrase contour exposes peak and climax evidence without mutating the song', () => {
  const song = makeInsightSong();
  const before = JSON.stringify(song);
  const result = analyzeSongInsights(song, insightOptions());
  assert.equal(result.contour.noteCount, 11);
  assert.equal(result.contour.peak.pitch, 72);
  assert.equal(result.contour.climaxCandidate.pitch, 72);
  assert.ok(['arch', 'ascending', 'mixed'].includes(result.contour.shape));
  assert.ok(result.contour.rangeSemitones >= 12);
  assert.match(result.contour.note, /正解|良し悪し/);
  assert.equal(JSON.stringify(song), before);
});

test('v0.23 compares section landing pitch, degree and chord relation', () => {
  const result = analyzeSongInsights(makeInsightSong(), insightOptions());
  assert.equal(result.landingComparison.entries.length, 2);
  const [first, second] = result.landingComparison.entries;
  assert.equal(first.label, 'A');
  assert.equal(first.pitch, 64);
  assert.equal(first.degree, 'III');
  assert.equal(first.chordTone, true);
  assert.equal(second.label, 'B');
  assert.equal(second.pitch, 67);
  assert.equal(second.degree, 'V');
  assert.equal(second.scaleTone, true);
  assert.match(result.landingComparison.note, /自動確定しません/);
});

test('v0.23 returns at most five ranked whole-song characteristics with evidence', () => {
  const result = analyzeSongInsights(makeInsightSong(), insightOptions());
  assert.ok(result.topCharacteristics.length > 0);
  assert.ok(result.topCharacteristics.length <= 5);
  assert.equal(new Set(result.topCharacteristics.map((item) => item.id)).size, result.topCharacteristics.length);
  for (const item of result.topCharacteristics) {
    assert.ok(item.title);
    assert.ok(item.evidence);
    assert.ok(item.meaning);
    assert.equal(Object.hasOwn(item, 'weight'), false);
  }
  assert.match(result.note, /品質|正解/);
});
