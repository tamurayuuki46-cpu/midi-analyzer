import test from 'node:test';
import assert from 'node:assert/strict';
import { buildVisualizationModel } from '../src/analysis/visualization/index.js';

function note(id, pitch, startTick, durationTick, velocity, trackId, channel = 0) {
  return { id, pitch, startTick, durationTick, velocity, trackId, channel, origin: 'midi' };
}

function makeSong() {
  const ppq = 480;
  const barTicks = ppq * 4;
  const notes = [];
  let id = 1;
  const chords = [
    [48, 52, 55],
    [43, 47, 50],
    [45, 48, 52],
    [41, 45, 48],
  ];

  for (let bar = 0; bar < 8; bar += 1) {
    const start = bar * barTicks;
    const chord = chords[bar % chords.length];
    chord.forEach((pitch) => notes.push(note(`n${id++}`, pitch + 12, start, barTicks, 80, 'chord')));
    notes.push(note(`n${id++}`, chord[0], start, barTicks, 92, 'bass'));
    notes.push(note(`n${id++}`, 72 + (bar % 5), start, ppq, 96, 'melody'));
    notes.push(note(`n${id++}`, 74 + (bar % 5), start + ppq, ppq, 90, 'melody'));
    for (let beat = 0; beat < 4; beat += 1) {
      notes.push(note(`n${id++}`, 36, start + beat * ppq, 60, 100, 'drums', 9));
    }
  }

  return {
    schemaVersion: '0.1',
    source: { fileName: 'visual.mid', origin: 'midi' },
    ppq,
    tempoMap: [{ tick: 0, microsecondsPerBeat: 500000, bpm: 120, implicit: true }],
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4, implicit: true }],
    lengthTicks: barTicks * 8,
    tracks: [
      { id: 'melody', name: 'Melody', channels: [0], noteCount: 16, isDrums: false, roleHint: 'melody' },
      { id: 'chord', name: 'Chord', channels: [0], noteCount: 24, isDrums: false, roleHint: 'chord' },
      { id: 'bass', name: 'Bass', channels: [0], noteCount: 8, isDrums: false, roleHint: 'bass' },
      { id: 'drums', name: 'Drums', channels: [9], noteCount: 32, isDrums: true, roleHint: 'drums' },
    ],
    notes,
  };
}

test('visualization model builds timelines, contours and rhythm bars', () => {
  const model = buildVisualizationModel(makeSong());
  assert.equal(model.bars.length, 8);
  assert.equal(model.melody.contour.length, 8);
  assert.equal(model.bass.contour.length, 8);
  assert.equal(model.rhythm.bars.length, 8);
  assert.ok(model.chordTimeline.length > 0);
  assert.ok(model.tonalTimeline.length > 0);
});

test('energy curve is normalized and heatmap keeps pitch-class cells', () => {
  const model = buildVisualizationModel(makeSong());
  assert.ok(model.rhythm.bars.every((bar) => bar.energy >= 0 && bar.energy <= 1));
  assert.equal(model.heatmap.pitchClasses.length, 12);
  assert.equal(model.heatmap.bars.length, 8);
  assert.equal(model.heatmap.cells.length, 8 * 12);
  assert.ok(model.heatmap.cells.some((cell) => cell.noteCount > 0));
});
