import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DIAGNOSTIC_INTENTS,
  analyzeIntentDiagnostic,
  buildIntentArrangementHandoff,
  buildSingleVariableExperiment,
} from '../src/analysis/diagnostic/index.js';

function melodyNote(id, pitch, startTick, durationTick = 360, velocity = 96) {
  return { id, pitch, startTick, durationTick, velocity, trackId: 'melody', channel: 0 };
}

function chordNote(id, pitch, startTick, durationTick) {
  return { id, pitch, startTick, durationTick, velocity: 80, trackId: 'chord', channel: 1 };
}

function makeSong(fileName = 'intent-loop.mid') {
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

function analysisOptions({ densityB = 1.4, averagePitchB = 68 } = {}) {
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

test('v0.25 exposes intent-driven top3 without quality score or internal weight', () => {
  const song = makeSong();
  const before = JSON.stringify(song);
  const result = analyzeIntentDiagnostic(song, {
    intentId: 'section-contrast',
    analysisOptions: analysisOptions(),
  });

  assert.equal(result.version, 'v0.25-dev');
  assert.equal(result.userIntent.id, 'section-contrast');
  assert.ok(result.priorities.length > 0);
  assert.ok(result.priorities.length <= 3);
  result.priorities.forEach((item, index) => {
    assert.equal(item.priority, index + 1);
    assert.ok(item.rationale);
    assert.ok(item.experiment?.variable);
    assert.ok(item.experiment?.verification);
    assert.equal(Object.hasOwn(item, 'weight'), false);
    assert.equal(Object.hasOwn(item, 'score'), false);
  });
  assert.match(result.note, /品質Score|正解判定/);
  assert.equal(JSON.stringify(song), before);
});

test('v0.25 intent changes priority emphasis while keeping evidence-based candidates', () => {
  const song = makeSong();
  const contrast = analyzeIntentDiagnostic(song, {
    intentId: 'section-contrast',
    analysisOptions: analysisOptions(),
  });
  const landing = analyzeIntentDiagnostic(song, {
    intentId: 'landing-focus',
    analysisOptions: analysisOptions(),
  });

  assert.equal(landing.priorities[0]?.id, 'section-landing-variation');
  assert.ok(contrast.priorities.some((item) => ['section-density-contrast', 'section-melody-range'].includes(item.id)));
  assert.notEqual(contrast.userIntent.id, landing.userIntent.id);
  assert.ok(DIAGNOSTIC_INTENTS.length >= 5);
});

test('v0.25 creates a single-variable experiment with explicit constants and verification', () => {
  const diagnostic = analyzeIntentDiagnostic(makeSong(), {
    intentId: 'harmony-tension',
    analysisOptions: analysisOptions(),
  });
  const experiment = buildSingleVariableExperiment(diagnostic, diagnostic.priorities[0].id);

  assert.ok(experiment);
  assert.equal(typeof experiment.variable, 'string');
  assert.ok(experiment.variable.length > 0);
  assert.ok(Array.isArray(experiment.keepConstant));
  assert.ok(experiment.keepConstant.length > 0);
  assert.ok(Array.isArray(experiment.choices));
  assert.ok(experiment.choices.length >= 2);
  assert.ok(Array.isArray(experiment.targetSections));
  assert.ok(experiment.verification);
});

test('v0.25 handoff keeps schema v1, sends one selected experiment, and never mutates source song', () => {
  const song = makeSong('intent-handoff.mid');
  const before = JSON.stringify(song);
  const diagnostic = analyzeIntentDiagnostic(song, {
    intentId: 'climax-shape',
    analysisOptions: analysisOptions(),
  });
  const selected = diagnostic.priorities[0];
  const handoff = buildIntentArrangementHandoff(song, diagnostic, selected.id);

  assert.equal(handoff.schemaVersion, 1);
  assert.equal(handoff.type, 'midi-analyzer-arrangement-handoff');
  assert.equal(handoff.mode, 'proposal-only');
  assert.equal(handoff.source.version, 'v0.25-dev');
  assert.equal(handoff.source.fileName, 'intent-handoff.mid');
  assert.equal(handoff.userIntent.id, 'climax-shape');
  assert.equal(handoff.priorities.length, 1);
  assert.equal(handoff.priorities[0].id, selected.id);
  assert.equal(handoff.experiment.priorityId, selected.id);
  assert.match(handoff.note, /1項目|自動適用/);
  assert.equal(JSON.stringify(song), before);
});
