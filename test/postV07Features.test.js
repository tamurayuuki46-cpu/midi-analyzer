import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExplanationReport, buildAiPrompt } from '../src/analysis/explanation/index.js';
import { analyzeHigherLevelMetrics } from '../src/analysis/metrics/index.js';
import { buildAnalysisBundle } from '../src/analysis/summary/index.js';
import { buildDemoComposerProject, exportAnalysisCsv, exportAnalysisJson, exportAnalysisMarkdown, exportChordDegreeText } from '../src/export/index.js';

function note(id, trackId, pitch, startTick, durationTick = 480, velocity = 96, channel = 0) {
  return { id, trackId, pitch, startTick, durationTick, velocity, channel, origin: 'midi' };
}

function makeSong() {
  const ppq = 480;
  const bar = 1920;
  const notes = [];
  const progression = [
    [48, [60, 64, 67]],
    [53, [65, 69, 72]],
    [55, [67, 71, 74]],
    [48, [60, 64, 67]],
  ];
  for (let barIndex = 0; barIndex < 8; barIndex += 1) {
    const start = barIndex * bar;
    const [bassPitch, chordPitches] = progression[Math.floor(barIndex / 2)];
    chordPitches.forEach((pitch, index) => notes.push(note(`c-${barIndex}-${index}`, 'chord', pitch, start, bar, 82)));
    notes.push(note(`b-${barIndex}`, 'bass', bassPitch, start, bar, 90));
    [0, 480, 960, 1440].forEach((offset, index) => notes.push(note(`m-${barIndex}-${index}`, 'melody', [72, 74, 76, 79][index], start + offset, 360, 100)));
    [240, 1200].forEach((offset, index) => notes.push(note(`x-${barIndex}-${index}`, 'counter', [67, 69][index], start + offset, 240, 76)));
    [0, 960].forEach((offset, index) => notes.push(note(`d-k-${barIndex}-${index}`, 'drums', 36, start + offset, 120, 105, 9)));
    [480, 1440].forEach((offset, index) => notes.push(note(`d-s-${barIndex}-${index}`, 'drums', 38, start + offset, 120, 100, 9)));
  }
  return {
    schemaVersion: '0.1',
    source: { fileName: 'feature-test.mid', origin: 'midi' },
    ppq,
    tempoMap: [{ tick: 0, bpm: 120 }],
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4 }],
    lengthTicks: 8 * bar,
    tracks: [
      { id: 'chord', name: 'Chord', channels: [0], noteCount: notes.filter((item) => item.trackId === 'chord').length, isDrums: false, roleHint: 'chord' },
      { id: 'melody', name: 'Melody', channels: [0], noteCount: notes.filter((item) => item.trackId === 'melody').length, isDrums: false, roleHint: 'melody' },
      { id: 'counter', name: 'Counter', channels: [0], noteCount: notes.filter((item) => item.trackId === 'counter').length, isDrums: false, roleHint: 'melody' },
      { id: 'bass', name: 'Bass', channels: [0], noteCount: notes.filter((item) => item.trackId === 'bass').length, isDrums: false, roleHint: 'bass' },
      { id: 'drums', name: 'Drums', channels: [9], noteCount: notes.filter((item) => item.trackId === 'drums').length, isDrums: true, roleHint: 'drums' },
    ],
    notes,
  };
}

test('analysis bundle combines existing analyzers without mutating the song', () => {
  const song = makeSong();
  const before = JSON.stringify(song);
  const bundle = buildAnalysisBundle(song);
  assert.ok(bundle.key.candidates.length > 0);
  assert.ok(bundle.chords.segments.length > 0);
  assert.ok(bundle.topChordProgression.length > 0);
  assert.equal(JSON.stringify(song), before);
});

test('Demo Composer adapter emits schema 3 project with PPQ 480 and analyzable parts', () => {
  const song = makeSong();
  const bundle = buildAnalysisBundle(song);
  const { project } = buildDemoComposerProject(song, bundle, { id: 'test-project', title: 'Feature Test' });
  assert.equal(project.schemaVersion, 3);
  assert.equal(project.id, 'test-project');
  assert.equal(project.basic.ppq, 480);
  assert.equal(project.basic.timeSignature, '4/4');
  assert.ok(project.chords.length > 0);
  assert.ok(project.tracks.some((track) => track.role === 'melody'));
  assert.ok(project.tracks.some((track) => track.role === 'bass'));
  assert.ok(project.tracks.some((track) => track.role === 'drums'));
});

test('JSON CSV Markdown and Chord/Degree text exporters produce useful output', () => {
  const song = makeSong();
  const bundle = buildAnalysisBundle(song);
  const metrics = analyzeHigherLevelMetrics(song, bundle);
  const explanation = buildExplanationReport(song, bundle, metrics);
  const json = JSON.parse(exportAnalysisJson(bundle));
  assert.equal(json.format, 'midi-analyzer-analysis');
  assert.match(exportAnalysisCsv(bundle), /category,index,bar/);
  assert.match(exportAnalysisMarkdown(bundle, { metrics, explanation }), /この曲から学べること/);
  assert.match(exportChordDegreeText(bundle), /Bar 1:/);
});

test('higher-level metrics stay in 0..100 and provide evidence', () => {
  const song = makeSong();
  const bundle = buildAnalysisBundle(song);
  const result = analyzeHigherLevelMetrics(song, bundle);
  assert.equal(result.metrics.length, 6);
  for (const metric of result.metrics) {
    assert.equal(Number.isInteger(metric.score), true);
    assert.ok(metric.score >= 0 && metric.score <= 100);
    assert.ok(metric.label.length > 0);
    assert.ok(Array.isArray(metric.evidence));
  }
  assert.ok(result.chorusCandidates.length > 0);
});

test('v0.8 explanation returns learning points, applications and an external-AI prompt package', () => {
  const song = makeSong();
  const bundle = buildAnalysisBundle(song);
  const metrics = analyzeHigherLevelMetrics(song, bundle);
  const report = buildExplanationReport(song, bundle, metrics);
  assert.equal(report.generatedLocally, true);
  assert.ok(report.learnings.length >= 3);
  assert.ok(report.applications.length >= 3);
  const prompt = buildAiPrompt(bundle, report);
  assert.match(prompt, /Key candidate:/);
  assert.match(prompt, /この曲から学べること/);
});
