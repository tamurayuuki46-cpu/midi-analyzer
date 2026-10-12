import { getDefaultBassTrackId, getDefaultMelodyTrackId, getDefaultRhythmTrackIds } from '../basic/index.js';
import { analyzeChords, buildAnalysisWindows, getDefaultChordTrackIds } from '../chord/index.js';
import { analyzeStructure } from '../structure/index.js';

const PITCH_CLASS_NAMES = Object.freeze(['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']);

function barsFromSong(song) {
  const windows = buildAnalysisWindows(song);
  const byBar = new Map();
  for (const window of windows) {
    const existing = byBar.get(window.barNumber);
    if (!existing) {
      byBar.set(window.barNumber, { barNumber: window.barNumber, startTick: window.startTick, endTick: window.endTick });
    } else {
      existing.startTick = Math.min(existing.startTick, window.startTick);
      existing.endTick = Math.max(existing.endTick, window.endTick);
    }
  }
  return [...byBar.values()].sort((a, b) => a.barNumber - b.barNumber);
}

function notesForTrack(song, trackId) {
  if (!trackId) return [];
  return (song?.notes ?? []).filter((note) => note.trackId === trackId && note.durationTick > 0 && note.channel !== 9);
}

function notesForTracks(song, trackIds) {
  const ids = new Set(trackIds ?? []);
  return (song?.notes ?? []).filter((note) => ids.has(note.trackId) && note.durationTick > 0);
}

function notesStartingInRange(notes, startTick, endTick) {
  return notes.filter((note) => note.startTick >= startTick && note.startTick < endTick);
}

function contourForBars(notes, bars) {
  return Object.freeze(bars.map((bar) => {
    const current = notesStartingInRange(notes, bar.startTick, bar.endTick);
    if (!current.length) {
      return Object.freeze({ barNumber: bar.barNumber, noteCount: 0, averagePitch: null, minPitch: null, maxPitch: null });
    }
    const pitches = current.map((note) => note.pitch);
    const averagePitch = pitches.reduce((sum, pitch) => sum + pitch, 0) / pitches.length;
    return Object.freeze({
      barNumber: bar.barNumber,
      noteCount: current.length,
      averagePitch: Number(averagePitch.toFixed(2)),
      minPitch: Math.min(...pitches),
      maxPitch: Math.max(...pitches),
    });
  }));
}

function rhythmForBars(notes, bars, ppq) {
  const raw = bars.map((bar) => {
    const current = notesStartingInRange(notes, bar.startTick, bar.endTick);
    const uniqueOnsets = new Set(current.map((note) => note.startTick)).size;
    const quarterLength = Math.max((bar.endTick - bar.startTick) / ppq, 0.0001);
    const density = uniqueOnsets / quarterLength;
    const velocityAverage = current.length
      ? current.reduce((sum, note) => sum + note.velocity, 0) / current.length
      : 0;
    const rawEnergy = density * (velocityAverage / 127);
    return {
      barNumber: bar.barNumber,
      onsetCount: uniqueOnsets,
      noteCount: current.length,
      density: Number(density.toFixed(3)),
      averageVelocity: Number(velocityAverage.toFixed(2)),
      rawEnergy,
    };
  });
  const maxEnergy = Math.max(...raw.map((item) => item.rawEnergy), 0);
  return Object.freeze(raw.map((item) => Object.freeze({
    barNumber: item.barNumber,
    onsetCount: item.onsetCount,
    noteCount: item.noteCount,
    density: item.density,
    averageVelocity: item.averageVelocity,
    energy: maxEnergy > 0 ? Number((item.rawEnergy / maxEnergy).toFixed(4)) : 0,
  })));
}

function buildHeatmap(song, bars, maxBars = 16) {
  const visibleBars = bars.slice(0, maxBars);
  const melodicNotes = (song?.notes ?? []).filter((note) => note.channel !== 9 && note.durationTick > 0);
  const rawCells = [];
  let maxCount = 0;

  for (const bar of visibleBars) {
    const current = notesStartingInRange(melodicNotes, bar.startTick, bar.endTick);
    for (let pitchClass = 0; pitchClass < 12; pitchClass += 1) {
      const matches = current.filter((note) => ((note.pitch % 12) + 12) % 12 === pitchClass);
      const avgVelocity = matches.length
        ? matches.reduce((sum, note) => sum + note.velocity, 0) / matches.length
        : 0;
      maxCount = Math.max(maxCount, matches.length);
      rawCells.push({ barNumber: bar.barNumber, pitchClass, noteCount: matches.length, averageVelocity: Number(avgVelocity.toFixed(2)) });
    }
  }

  const cells = rawCells.map((cell) => Object.freeze({
    ...cell,
    level: maxCount > 0 ? Number((cell.noteCount / maxCount).toFixed(4)) : 0,
  }));

  return Object.freeze({
    bars: Object.freeze(visibleBars.map((bar) => bar.barNumber)),
    pitchClasses: PITCH_CLASS_NAMES,
    cells: Object.freeze(cells),
    truncated: bars.length > maxBars,
  });
}

export function buildVisualizationModel(song) {
  const bars = barsFromSong(song);
  const structure = analyzeStructure(song);
  const chord = analyzeChords(song, { trackIds: getDefaultChordTrackIds(song) });
  const melodyTrackId = getDefaultMelodyTrackId(song);
  const bassTrackId = getDefaultBassTrackId(song);
  const rhythmTrackIds = getDefaultRhythmTrackIds(song);
  const melodyNotes = notesForTrack(song, melodyTrackId);
  const bassNotes = notesForTrack(song, bassTrackId);
  const rhythmNotes = notesForTracks(song, rhythmTrackIds);

  return Object.freeze({
    bars: Object.freeze(bars),
    tonalTimeline: Object.freeze(structure.keyTimeline.map((entry) => Object.freeze({
      startBar: entry.startBar,
      endBar: entry.endBar,
      value: entry.effective?.value ?? null,
      confidence: entry.effective?.confidence ?? 0,
    }))),
    chordTimeline: Object.freeze(chord.segments.map((segment) => Object.freeze({
      barNumber: segment.barNumber,
      startTick: segment.startTick,
      endTick: segment.endTick,
      value: segment.candidates[0]?.value ?? null,
      confidence: segment.candidates[0]?.confidence ?? 0,
    }))),
    melody: Object.freeze({ trackId: melodyTrackId, contour: contourForBars(melodyNotes, bars) }),
    bass: Object.freeze({ trackId: bassTrackId, contour: contourForBars(bassNotes, bars) }),
    rhythm: Object.freeze({ trackIds: Object.freeze([...rhythmTrackIds]), bars: rhythmForBars(rhythmNotes, bars, song?.ppq || 480) }),
    sections: Object.freeze(structure.sections.map((section) => Object.freeze({
      label: section.label,
      startBar: section.startBar,
      endBar: section.endBar,
      similarity: section.similarity,
      density: section.metrics.density,
    }))),
    heatmap: buildHeatmap(song, bars),
    note: 'VisualizationはNormalized Songと既存Analyzerの結果を可視化したものです。新しい確定判定は行いません。',
  });
}
