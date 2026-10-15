import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeDiagnosticLoop,
  buildArrangementLabHandoff,
  compareDiagnosticSongs,
} from '../src/analysis/diagnostic/index.js';

function melodyNote(id, pitch, startTick, durationTick = 360, velocity = 96) {
  return { id, pitch, startTick, durationTick, velocity, trackId: 'melody', channel: 0 };
}

function chordNote(id, pitch, startTick, durationTick) {
  return { id, pitch, startTick, durationTick, velocity: 80, trackId: 'chord', channel: 1 };
}

function makeSong(fileName = 'diagnostic.mid') {
  const ppq = 480;
  const barTicks = ppq * 4;
  const firstEnd = barTicks * 4;
  const songEnd = barTicks * 8;
  const notes = [
    melodyNote('m1', 60, 0),
    melodyNote('m2', 62, 960),
    melodyNote('m3', 64, 1920),
    melodyNote('m4', 67, 3840),
    melodyNote('m5', 64, firstEnd - 480, 240, 104),
    melodyNote('m6', 65, firstEnd + 240),
    melodyNote('m7', 67, firstEnd + 1440),
    melodyNote('m8', 72, firstEnd + 2880, 360, 127),
    melodyNote('m9', 67, songEnd - 480, 240, 110),
  ];
  [60, 64, 67].forEach((pitch, index) => notes.push(chordNote(`c1-${index}`, pitch, 0, firstEnd)));
  [65, 69, 72].forEach((pitch, index) => notes.push(chordNote(`c2-${index}`, pitch, firstEnd, songEnd - firstEnd)));
  return {
    ppq,
    lengthTicks: songEnd,
    source: { fileName },
    tempoMap: [{ tick: 0, bpm: 120 }],
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
    tracks: [
      { id: 'melody', name: 'Melody', noteCount: 9, isDrums: false, roleHint: 'melody', channels: [0] },
      { id: 'chord', name: 'Chord', noteCount: 6, isDrums: false, roleHint: 'chord', channels: [1] },
    ],
    notes,
  };
}

function options({ densityB = 1.4, averagePitchB = 68 } = {}) {
  const firstEnd = 480 * 4 * 4;
  const songEnd = 480 * 4 * 8;
  return {
    trackId: 'melody',
    keyValue: 'C major',
    structure: {
      sections: [
        { id: 'block-1', label: 'A', startBar: 1, endBar: 4, startTick: 0, endTick: firstEnd, similarity: 1, metrics: { noteCount: 5, density: 0.8, averagePitch: 63.4, averageVelocity: 100 } },
        { id: 'block-2', label: 'B', startBar: 5, endBar: 8, startTick: firstEnd, endTick: songEnd, similarity: 0.5, metrics: { noteCount: 4, density: densityB, averagePitch: averagePitchB, averageVelocity: 105 } },
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

test('v0.24 compares sections and explains metric meaning without quality scoring', () => {
  const song = makeSong();
  const before = JSON.stringify(song);
  const result = analyzeDiagnosticLoop(song, options());

  assert.equal(result.sectionComparison.sections.length, 2);
  assert.equal(result.sectionComparison.adjacent.length, 1);
  assert.match(result.sectionComparison.adjacent[0].meaning, /Note密度/);
  assert.ok(result.metricMeanings.length >= 3);
  for (const item of result.metricMeanings) {
    assert.ok(item.evidence);
    assert.ok(item.meaning);
  }
  assert.match(result.sectionComparison.note, /品質|良し悪し/);
  assert.equal(JSON.stringify(song), before);
});

test('v0.24 returns at most three review priorities with actionable Arrangement intents', () => {
  const result = analyzeDiagnosticLoop(makeSong(), options());
  assert.ok(result.priorities.length > 0);
  assert.ok(result.priorities.length <= 3);
  result.priorities.forEach((item, index) => {
    assert.equal(item.priority, index + 1);
    assert.ok(item.title);
    assert.ok(item.evidence);
    assert.ok(item.action);
    assert.ok(item.intent);
    assert.equal(Object.hasOwn(item, 'weight'), false);
  });
  assert.match(result.note, /採点ではなく/);
});

test('v0.24 builds a proposal-only Arrangement Lab handoff without changing the source song', () => {
  const song = makeSong('handoff.mid');
  const before = JSON.stringify(song);
  const diagnostic = analyzeDiagnosticLoop(song, options());
  const handoff = buildArrangementLabHandoff(song, diagnostic);

  assert.equal(handoff.schemaVersion, 1);
  assert.equal(handoff.type, 'midi-analyzer-arrangement-handoff');
  assert.equal(handoff.mode, 'proposal-only');
  assert.equal(handoff.source.fileName, 'handoff.mid');
  assert.deepEqual(handoff.priorities.map((item) => item.id), diagnostic.priorities.map((item) => item.id));
  assert.match(handoff.note, /Arrangement Lab/);
  assert.equal(JSON.stringify(song), before);
});

test('v0.24 re-analyzes before/after MIDI and reports observable changes', () => {
  const beforeSong = makeSong('before.mid');
  const afterSong = structuredClone(beforeSong);
  afterSong.source.fileName = 'after.mid';
  afterSong.notes.push(melodyNote('m10', 79, 480 * 4 * 6, 360, 118));
  afterSong.tracks[0].noteCount += 1;

  const result = compareDiagnosticSongs(beforeSong, afterSong, {
    beforeOptions: options({ densityB: 1.0 }),
    afterOptions: options({ densityB: 1.8, averagePitchB: 71 }),
  });

  assert.ok(result.changes.length >= 4);
  const density = result.changes.find((item) => item.id === 'section-density-spread');
  assert.ok(density);
  assert.ok(density.after > density.before);
  const range = result.changes.find((item) => item.id === 'whole-melody-range');
  assert.ok(range);
  assert.ok(range.after > range.before);
  assert.match(result.note, /改善度|品質Score/);
});
