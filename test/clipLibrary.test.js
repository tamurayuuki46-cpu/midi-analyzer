import test from 'node:test';
import assert from 'node:assert/strict';
import { buildClipRecord, buildFourBarRanges, filterClipRecords } from '../src/library/clipModel.js';

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
    const motif = [72, 74, 76, 79];
    motif.forEach((pitch, step) => notes.push(note(`n${id++}`, pitch, start + step * ppq, ppq / 2, 96, 'melody')));
    for (let beat = 0; beat < 4; beat += 1) {
      notes.push(note(`n${id++}`, beat % 2 ? 38 : 36, start + beat * ppq, 60, 100, 'drums', 9));
    }
  }

  return {
    schemaVersion: '0.1',
    source: { fileName: 'library.mid', origin: 'midi' },
    ppq,
    tempoMap: [{ tick: 0, microsecondsPerBeat: 500000, bpm: 120, implicit: true }],
    timeSignatures: [{ tick: 0, numerator: 4, denominator: 4, implicit: true }],
    lengthTicks: barTicks * 8,
    tracks: [
      { id: 'melody', name: 'Melody', channels: [0], noteCount: 32, isDrums: false, roleHint: 'melody' },
      { id: 'chord', name: 'Chord', channels: [0], noteCount: 24, isDrums: false, roleHint: 'chord' },
      { id: 'bass', name: 'Bass', channels: [0], noteCount: 8, isDrums: false, roleHint: 'bass' },
      { id: 'drums', name: 'Drums', channels: [9], noteCount: 32, isDrums: true, roleHint: 'drums' },
    ],
    notes,
  };
}

test('buildFourBarRanges returns every contiguous 4-bar slice', () => {
  const ranges = buildFourBarRanges(makeSong());
  assert.equal(ranges.length, 5);
  assert.deepEqual(ranges.map((range) => [range.startBar, range.endBar]), [
    [1, 4], [2, 5], [3, 6], [4, 7], [5, 8],
  ]);
  assert.ok(ranges.every((range) => range.complete));
});

test('melody clip rebases notes and assigns automatic BPM/Key tags', () => {
  const clip = buildClipRecord(makeSong(), {
    type: 'melody',
    startBar: 2,
    id: 'melody-clip',
    savedAt: '2026-10-13T00:00:00.000Z',
    tags: { genre: 'J-POP', mood: 'bright', custom: 'verse, hook, verse' },
  });
  assert.equal(clip.type, 'melody');
  assert.equal(clip.range.startBar, 2);
  assert.equal(clip.range.endBar, 5);
  assert.ok(clip.notes.length > 0);
  assert.ok(clip.notes.every((item) => item.startTick >= 0 && item.startTick < clip.range.lengthTicks));
  assert.ok(clip.notes.every((item) => item.trackId === 'melody'));
  assert.equal(clip.tags.bpm, 120);
  assert.ok(clip.tags.key.length > 0);
  assert.deepEqual(clip.tags.custom, ['verse', 'hook']);
});

test('chord and drum clips keep the appropriate part context', () => {
  const song = makeSong();
  const chord = buildClipRecord(song, { type: 'chord', startBar: 1, id: 'chord-clip' });
  const drum = buildClipRecord(song, { type: 'drum', startBar: 1, id: 'drum-clip' });
  assert.ok(chord.chordProgression.length > 0);
  assert.ok(chord.notes.every((item) => item.trackId === 'chord'));
  assert.ok(drum.notes.length > 0);
  assert.ok(drum.notes.every((item) => item.channel === 9));
});

test('motif clip carries motif candidates without changing source song', () => {
  const song = makeSong();
  const originalFirstTick = song.notes[0].startTick;
  const clip = buildClipRecord(song, { type: 'motif', startBar: 1, id: 'motif-clip' });
  assert.ok(Array.isArray(clip.motifs));
  assert.ok(clip.motifs.length > 0);
  assert.equal(song.notes[0].startTick, originalFirstTick);
});

test('filterClipRecords matches metadata, tags and chord names with AND tokens', () => {
  const song = makeSong();
  const first = buildClipRecord(song, {
    type: 'chord',
    id: 'first',
    tags: { genre: 'J-POP', mood: 'bright', key: 'C major', custom: 'chorus favorite' },
  });
  const second = buildClipRecord(song, {
    type: 'bass',
    id: 'second',
    tags: { genre: 'Rock', mood: 'dark', custom: 'verse' },
  });
  assert.deepEqual(filterClipRecords([first, second], 'J-POP chorus').map((item) => item.id), ['first']);
  assert.deepEqual(filterClipRecords([first, second], 'bass dark').map((item) => item.id), ['second']);
  const chordName = first.chordProgression[0]?.value;
  assert.ok(chordName);
  assert.deepEqual(filterClipRecords([first, second], chordName).map((item) => item.id).includes('first'), true);
});
