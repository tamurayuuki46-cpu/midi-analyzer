import { getDefaultBassTrackId, getDefaultMelodyTrackId } from '../basic/index.js';
import { analyzeChords, buildAnalysisWindows } from '../chord/index.js';

const PITCH_NAMES = Object.freeze(['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']);

const GM_DRUM_GROUPS = Object.freeze({
  kick: Object.freeze([35, 36]),
  snare: Object.freeze([37, 38, 39, 40]),
  hiHat: Object.freeze([42, 44, 46]),
  tom: Object.freeze([41, 43, 45, 47, 48, 50]),
  crash: Object.freeze([49, 52, 55, 57]),
  ride: Object.freeze([51, 53, 59]),
});

const GM_DRUM_NAMES = Object.freeze(new Map([
  [35, 'Acoustic Bass Drum'], [36, 'Bass Drum 1'], [37, 'Side Stick'], [38, 'Acoustic Snare'],
  [39, 'Hand Clap'], [40, 'Electric Snare'], [41, 'Low Floor Tom'], [42, 'Closed Hi-Hat'],
  [43, 'High Floor Tom'], [44, 'Pedal Hi-Hat'], [45, 'Low Tom'], [46, 'Open Hi-Hat'],
  [47, 'Low-Mid Tom'], [48, 'Hi-Mid Tom'], [49, 'Crash Cymbal 1'], [50, 'High Tom'],
  [51, 'Ride Cymbal 1'], [52, 'Chinese Cymbal'], [53, 'Ride Bell'], [54, 'Tambourine'],
  [55, 'Splash Cymbal'], [56, 'Cowbell'], [57, 'Crash Cymbal 2'], [58, 'Vibraslap'],
  [59, 'Ride Cymbal 2'],
]));

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function round(value, digits = 3) {
  if (!Number.isFinite(value)) return null;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function pitchClass(pitch) {
  return ((pitch % 12) + 12) % 12;
}

function circularPitchClassDistance(a, b) {
  const direct = Math.abs(a - b) % 12;
  return Math.min(direct, 12 - direct);
}

function trackById(song, id) {
  return (song?.tracks ?? []).find((track) => track.id === id) ?? null;
}

function trackNotes(song, trackId) {
  return (song?.notes ?? [])
    .filter((note) => note.trackId === trackId && note.channel !== 9 && note.durationTick > 0)
    .sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
}

function averagePitch(notes) {
  if (!notes.length) return null;
  return notes.reduce((sum, note) => sum + note.pitch, 0) / notes.length;
}

function polyphonyRatio(notes) {
  if (!notes.length) return 0;
  const uniqueOnsets = new Set(notes.map((note) => note.startTick)).size;
  return clamp01(1 - uniqueOnsets / notes.length);
}

function candidateCounterTrackId(song, melodyTrackId) {
  const candidates = (song?.tracks ?? [])
    .filter((track) => !track.isDrums && track.noteCount > 0 && track.id !== melodyTrackId)
    .map((track) => {
      const notes = trackNotes(song, track.id);
      const avgPitch = averagePitch(notes) ?? 0;
      const polyphony = polyphonyRatio(notes);
      let score = avgPitch;
      if (track.roleHint === 'melody') score += 24;
      if (track.roleHint === 'bass') score -= 36;
      if (track.roleHint === 'chord') score -= 18;
      score -= polyphony * 36;
      return { track, notes, avgPitch, polyphony, score };
    })
    .filter((item) => item.polyphony <= 0.45 && item.track.roleHint !== 'bass')
    .sort((a, b) => b.score - a.score || b.avgPitch - a.avgPitch);
  return candidates[0]?.track.id ?? null;
}

function representativePitch(notes, startTick, endTick) {
  const active = notes.filter((note) => {
    const noteEnd = note.startTick + note.durationTick;
    return note.startTick < endTick && noteEnd > startTick;
  });
  if (!active.length) return null;
  active.sort((a, b) => b.velocity - a.velocity || b.durationTick - a.durationTick || b.pitch - a.pitch);
  return active[0].pitch;
}

export function analyzeCounterMelody(song, options = {}) {
  const melodyTrackId = options.melodyTrackId ?? getDefaultMelodyTrackId(song);
  const counterTrackId = options.counterTrackId ?? candidateCounterTrackId(song, melodyTrackId);
  const melodyTrack = trackById(song, melodyTrackId);
  const counterTrack = trackById(song, counterTrackId);
  const melodyNotes = trackNotes(song, melodyTrackId);
  const counterNotes = trackNotes(song, counterTrackId);
  const ppq = Number(song?.ppq);

  if (!melodyTrack || !counterTrack || !melodyNotes.length || !counterNotes.length || !Number.isFinite(ppq) || ppq <= 0) {
    return Object.freeze({
      melodyTrackId: melodyTrackId ?? null,
      counterTrackId: counterTrackId ?? null,
      melodyTrackName: melodyTrack?.name ?? null,
      counterTrackName: counterTrack?.name ?? null,
      motion: Object.freeze({ contrary: 0, parallel: 0, oblique: 0, evaluated: 0, contraryRatio: null, parallelRatio: null, obliqueRatio: null }),
      gaps: Object.freeze({ counterInMelodyGap: 0, counterBins: 0, ratio: null }),
      collisions: Object.freeze({ secondIntervalCandidates: 0, simultaneousBins: 0, ratio: null }),
      register: Object.freeze({ above: 0, below: 0, same: 0, aboveRatio: null }),
      note: '主旋律と比較できる裏メロ候補Trackが不足しています。',
    });
  }

  const gridTicks = Math.max(1, ppq / 2);
  const lengthTicks = Number(song?.lengthTicks) || Math.max(
    ...melodyNotes.map((note) => note.startTick + note.durationTick),
    ...counterNotes.map((note) => note.startTick + note.durationTick),
  );
  const bins = [];
  for (let startTick = 0; startTick < lengthTicks; startTick += gridTicks) {
    bins.push({
      startTick,
      melodyPitch: representativePitch(melodyNotes, startTick, startTick + gridTicks),
      counterPitch: representativePitch(counterNotes, startTick, startTick + gridTicks),
    });
  }

  let contrary = 0;
  let parallel = 0;
  let oblique = 0;
  let evaluatedMotion = 0;
  let counterInMelodyGap = 0;
  let counterBins = 0;
  let simultaneousBins = 0;
  let collisionCandidates = 0;
  let above = 0;
  let below = 0;
  let same = 0;

  for (const bin of bins) {
    if (bin.counterPitch !== null) {
      counterBins += 1;
      if (bin.melodyPitch === null) counterInMelodyGap += 1;
    }
    if (bin.melodyPitch !== null && bin.counterPitch !== null) {
      simultaneousBins += 1;
      if (bin.counterPitch > bin.melodyPitch) above += 1;
      else if (bin.counterPitch < bin.melodyPitch) below += 1;
      else same += 1;
      const intervalClass = circularPitchClassDistance(pitchClass(bin.melodyPitch), pitchClass(bin.counterPitch));
      if (intervalClass === 1 || intervalClass === 2) collisionCandidates += 1;
    }
  }

  for (let index = 1; index < bins.length; index += 1) {
    const previous = bins[index - 1];
    const current = bins[index];
    if ([previous.melodyPitch, previous.counterPitch, current.melodyPitch, current.counterPitch].some((item) => item === null)) continue;
    const melodyDelta = current.melodyPitch - previous.melodyPitch;
    const counterDelta = current.counterPitch - previous.counterPitch;
    if (!melodyDelta && !counterDelta) continue;
    evaluatedMotion += 1;
    if (melodyDelta * counterDelta < 0) contrary += 1;
    else if ((melodyDelta === 0) !== (counterDelta === 0)) oblique += 1;
    else if (melodyDelta * counterDelta > 0) parallel += 1;
  }

  return Object.freeze({
    melodyTrackId,
    counterTrackId,
    melodyTrackName: melodyTrack.name,
    counterTrackName: counterTrack.name,
    gridTicks,
    motion: Object.freeze({
      contrary,
      parallel,
      oblique,
      evaluated: evaluatedMotion,
      contraryRatio: evaluatedMotion ? round(contrary / evaluatedMotion) : null,
      parallelRatio: evaluatedMotion ? round(parallel / evaluatedMotion) : null,
      obliqueRatio: evaluatedMotion ? round(oblique / evaluatedMotion) : null,
    }),
    gaps: Object.freeze({
      counterInMelodyGap,
      counterBins,
      ratio: counterBins ? round(counterInMelodyGap / counterBins) : null,
    }),
    collisions: Object.freeze({
      secondIntervalCandidates: collisionCandidates,
      simultaneousBins,
      ratio: simultaneousBins ? round(collisionCandidates / simultaneousBins) : null,
    }),
    register: Object.freeze({
      above,
      below,
      same,
      aboveRatio: simultaneousBins ? round(above / simultaneousBins) : null,
    }),
    note: '2度の同時発音は衝突「候補」として数えます。音楽的に悪いとは判定しません。',
  });
}

function representativeBassOnsets(notes) {
  const byTick = new Map();
  for (const note of notes) {
    const current = byTick.get(note.startTick);
    if (!current || note.pitch < current.pitch || (note.pitch === current.pitch && note.velocity > current.velocity)) {
      byTick.set(note.startTick, note);
    }
  }
  return [...byTick.values()].sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
}

export function analyzeBassDetail(song, options = {}) {
  const trackId = options.trackId ?? getDefaultBassTrackId(song);
  const track = trackById(song, trackId);
  const onsets = representativeBassOnsets(trackNotes(song, trackId));
  if (!track || !onsets.length) {
    return Object.freeze({ trackId: trackId ?? null, trackName: track?.name ?? null, noteCount: 0, note: 'Bass詳細分析に使えるTrackがありません。' });
  }

  const pitchClassCounts = new Map();
  for (const note of onsets) {
    const pc = pitchClass(note.pitch);
    pitchClassCounts.set(pc, (pitchClassCounts.get(pc) ?? 0) + 1);
  }
  const dominantPc = [...pitchClassCounts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0] ?? null;

  let octaveMoves = 0;
  let chromaticSteps = 0;
  let stepwiseMoves = 0;
  const transitionCount = Math.max(0, onsets.length - 1);
  for (let index = 1; index < onsets.length; index += 1) {
    const distance = Math.abs(onsets[index].pitch - onsets[index - 1].pitch);
    if (distance === 12) octaveMoves += 1;
    if (distance === 1) chromaticSteps += 1;
    if (distance <= 2) stepwiseMoves += 1;
  }

  const chordSegments = analyzeChords(song).segments;
  let approachEvaluated = 0;
  let approachCandidates = 0;
  for (let index = 1; index < chordSegments.length; index += 1) {
    const boundary = chordSegments[index].startTick;
    const nextRoot = chordSegments[index].candidates?.[0]?.root;
    if (!Number.isInteger(nextRoot)) continue;
    const previousBass = [...onsets].reverse().find((note) => note.startTick < boundary);
    if (!previousBass) continue;
    approachEvaluated += 1;
    const distance = circularPitchClassDistance(pitchClass(previousBass.pitch), nextRoot);
    if (distance === 1 || distance === 2) approachCandidates += 1;
  }

  return Object.freeze({
    trackId,
    trackName: track.name,
    noteCount: onsets.length,
    pedal: Object.freeze({
      pitchClass: dominantPc ? dominantPc[0] : null,
      name: dominantPc ? PITCH_NAMES[dominantPc[0]] : null,
      count: dominantPc ? dominantPc[1] : 0,
      ratio: dominantPc ? round(dominantPc[1] / onsets.length) : null,
    }),
    movement: Object.freeze({
      transitionCount,
      octaveMoves,
      octaveRatio: transitionCount ? round(octaveMoves / transitionCount) : null,
      chromaticSteps,
      chromaticRatio: transitionCount ? round(chromaticSteps / transitionCount) : null,
      stepwiseMoves,
      stepwiseRatio: transitionCount ? round(stepwiseMoves / transitionCount) : null,
    }),
    approach: Object.freeze({
      evaluated: approachEvaluated,
      semitoneOrWholeToneToNextRoot: approachCandidates,
      ratio: approachEvaluated ? round(approachCandidates / approachEvaluated) : null,
    }),
    note: 'ペダル、オクターブ、半音進行、コード変化前のRoot接近候補を表示します。',
  });
}

function drumGroupForPitch(pitch) {
  for (const [group, pitches] of Object.entries(GM_DRUM_GROUPS)) {
    if (pitches.includes(pitch)) return group;
  }
  return 'other';
}

function drumNotes(song) {
  const drumTrackIds = new Set((song?.tracks ?? []).filter((track) => track.isDrums).map((track) => track.id));
  return (song?.notes ?? []).filter((note) => note.durationTick >= 0 && (note.channel === 9 || drumTrackIds.has(note.trackId)));
}

function barRanges(song) {
  const windows = buildAnalysisWindows(song);
  const bars = new Map();
  for (const window of windows) {
    const current = bars.get(window.barNumber) ?? { barNumber: window.barNumber, startTick: window.startTick, endTick: window.endTick };
    current.startTick = Math.min(current.startTick, window.startTick);
    current.endTick = Math.max(current.endTick, window.endTick);
    bars.set(window.barNumber, current);
  }
  return [...bars.values()].sort((a, b) => a.barNumber - b.barNumber);
}

export function analyzeDrumDetail(song) {
  const notes = drumNotes(song);
  if (!notes.length) {
    return Object.freeze({ noteCount: 0, categoryCounts: Object.freeze({}), usedGmNotes: Object.freeze([]), fills: Object.freeze([]), note: 'Drum Noteがありません。' });
  }

  const categoryCounts = { kick: 0, snare: 0, hiHat: 0, tom: 0, crash: 0, ride: 0, other: 0 };
  const usedCounts = new Map();
  for (const note of notes) {
    categoryCounts[drumGroupForPitch(note.pitch)] += 1;
    usedCounts.set(note.pitch, (usedCounts.get(note.pitch) ?? 0) + 1);
  }

  const usedGmNotes = [...usedCounts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([pitch, count]) => Object.freeze({ pitch, name: GM_DRUM_NAMES.get(pitch) ?? `GM Note ${pitch}`, group: drumGroupForPitch(pitch), count }));

  const bars = barRanges(song).map((bar) => {
    const barNotes = notes.filter((note) => note.startTick >= bar.startTick && note.startTick < bar.endTick);
    const onsets = new Set(barNotes.map((note) => note.startTick)).size;
    const tomCount = barNotes.filter((note) => drumGroupForPitch(note.pitch) === 'tom').length;
    return { ...bar, noteCount: barNotes.length, onsetCount: onsets, tomCount };
  });
  const averageOnsets = bars.length ? bars.reduce((sum, bar) => sum + bar.onsetCount, 0) / bars.length : 0;
  const fills = bars
    .filter((bar) => bar.tomCount >= 2 || (averageOnsets > 0 && bar.onsetCount >= Math.max(4, averageOnsets * 1.5)))
    .map((bar) => Object.freeze({
      barNumber: bar.barNumber,
      onsetCount: bar.onsetCount,
      tomCount: bar.tomCount,
      reason: bar.tomCount >= 2 ? 'Tom集中' : '発音密度上昇',
    }));

  return Object.freeze({
    noteCount: notes.length,
    categoryCounts: Object.freeze(categoryCounts),
    usedGmNotes: Object.freeze(usedGmNotes),
    fills: Object.freeze(fills),
    averageOnsetsPerBar: round(averageOnsets),
    note: 'FillはTom集中または小節内発音密度上昇から作る候補です。',
  });
}

function classifyTrack(song, track) {
  const notes = trackNotes(song, track.id);
  if (track.isDrums || (track.channels ?? []).includes(9)) {
    return Object.freeze({ trackId: track.id, trackName: track.name, roleCandidate: 'drums', confidence: 1, reasons: Object.freeze(['Drum Track / Channel 10']) });
  }
  if (!notes.length) return Object.freeze({ trackId: track.id, trackName: track.name, roleCandidate: 'other', confidence: 0, reasons: Object.freeze(['Noteなし']) });

  const avgPitch = averagePitch(notes);
  const polyphony = polyphonyRatio(notes);
  let roleCandidate = 'other';
  let confidence = 0.45;
  const reasons = [];

  if (track.roleHint && ['melody', 'chord', 'bass'].includes(track.roleHint)) {
    roleCandidate = track.roleHint;
    confidence = 0.9;
    reasons.push(`roleHint=${track.roleHint}`);
  } else if (avgPitch < 52) {
    roleCandidate = 'bass';
    confidence = clamp01(0.65 + Math.min(0.2, (52 - avgPitch) / 60));
    reasons.push(`平均Pitch ${round(avgPitch, 1)}が低い`);
  } else if (polyphony >= 0.25) {
    roleCandidate = 'chord';
    confidence = clamp01(0.6 + Math.min(0.25, polyphony));
    reasons.push(`同時発音傾向 ${Math.round(polyphony * 100)}%`);
  } else if (avgPitch >= 60) {
    roleCandidate = 'melody';
    confidence = clamp01(0.62 + Math.min(0.2, (avgPitch - 60) / 60));
    reasons.push(`平均Pitch ${round(avgPitch, 1)} / 単音寄り`);
  } else {
    reasons.push(`平均Pitch ${round(avgPitch, 1)} / 同時発音 ${Math.round(polyphony * 100)}%`);
  }

  return Object.freeze({
    trackId: track.id,
    trackName: track.name,
    roleCandidate,
    confidence: round(confidence),
    averagePitch: round(avgPitch, 1),
    polyphonyRatio: round(polyphony),
    reasons: Object.freeze(reasons),
  });
}

export function analyzePartCandidates(song) {
  const candidates = (song?.tracks ?? []).filter((track) => track.noteCount > 0).map((track) => classifyTrack(song, track));
  return Object.freeze({
    candidates: Object.freeze(candidates),
    note: 'Track名・roleHint・音域・同時発音傾向から役割候補を表示します。自動確定はしません。',
  });
}

export function analyzePartDeep(song, options = {}) {
  return Object.freeze({
    counterMelody: analyzeCounterMelody(song, options.counterMelody),
    bass: analyzeBassDetail(song, options.bass),
    drums: analyzeDrumDetail(song),
    parts: analyzePartCandidates(song),
  });
}
