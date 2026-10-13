const PITCH_CLASS_NAMES = Object.freeze(['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']);

const CHORD_INTERVALS = Object.freeze({
  major: Object.freeze([0, 4, 7]),
  minor: Object.freeze([0, 3, 7]),
  dim: Object.freeze([0, 3, 6]),
  aug: Object.freeze([0, 4, 8]),
  sus2: Object.freeze([0, 2, 7]),
  sus4: Object.freeze([0, 5, 7]),
  7: Object.freeze([0, 4, 7, 10]),
  maj7: Object.freeze([0, 4, 7, 11]),
  m7: Object.freeze([0, 3, 7, 10]),
  m7b5: Object.freeze([0, 3, 6, 10]),
});

const THIRD_INTERVALS = Object.freeze({
  major: Object.freeze([4]),
  minor: Object.freeze([3]),
  dim: Object.freeze([3]),
  aug: Object.freeze([4]),
  7: Object.freeze([4]),
  maj7: Object.freeze([4]),
  m7: Object.freeze([3]),
  m7b5: Object.freeze([3]),
});

const FIFTH_INTERVALS = Object.freeze({
  major: Object.freeze([7]),
  minor: Object.freeze([7]),
  dim: Object.freeze([6]),
  aug: Object.freeze([8]),
  sus2: Object.freeze([7]),
  sus4: Object.freeze([7]),
  7: Object.freeze([7]),
  maj7: Object.freeze([7]),
  m7: Object.freeze([7]),
  m7b5: Object.freeze([6]),
});

function mod(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function pitchClass(pitch) {
  return mod(pitch, 12);
}

function usableTracks(song) {
  return (song?.tracks ?? []).filter((track) => !track.isDrums && track.noteCount > 0);
}

function trackNotes(song, trackId, { includeDrums = false } = {}) {
  if (!trackId) return [];
  return (song?.notes ?? [])
    .filter((note) => note.trackId === trackId && note.durationTick > 0 && (includeDrums || note.channel !== 9))
    .sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch || b.velocity - a.velocity);
}

function averagePitch(notes) {
  if (!notes.length) return null;
  return notes.reduce((sum, note) => sum + note.pitch, 0) / notes.length;
}

function defaultTrackByPitch(song, direction) {
  const candidates = usableTracks(song)
    .map((track) => ({ track, average: averagePitch(trackNotes(song, track.id)) }))
    .filter((entry) => Number.isFinite(entry.average));
  if (!candidates.length) return null;
  candidates.sort((a, b) => direction * (a.average - b.average) || b.track.noteCount - a.track.noteCount || a.track.id.localeCompare(b.track.id));
  return candidates[0].track.id;
}

export function getDefaultMelodyTrackId(song) {
  const hinted = usableTracks(song).find((track) => track.roleHint === 'melody');
  return hinted?.id ?? defaultTrackByPitch(song, -1);
}

export function getDefaultBassTrackId(song) {
  const hinted = usableTracks(song).find((track) => track.roleHint === 'bass');
  return hinted?.id ?? defaultTrackByPitch(song, 1);
}

export function getDefaultRhythmTrackIds(song) {
  const tracks = (song?.tracks ?? []).filter((track) => track.noteCount > 0);
  const drums = tracks.filter((track) => track.isDrums || track.roleHint === 'drums');
  return Object.freeze((drums.length ? drums : tracks).map((track) => track.id));
}

function representativeOnsets(notes, mode = 'melody') {
  const groups = new Map();
  for (const note of notes) {
    const bucket = groups.get(note.startTick) ?? [];
    bucket.push(note);
    groups.set(note.startTick, bucket);
  }

  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, bucket]) => {
      if (mode === 'bass') return [...bucket].sort((a, b) => a.pitch - b.pitch || b.velocity - a.velocity || b.durationTick - a.durationTick)[0];
      return [...bucket].sort((a, b) => b.velocity - a.velocity || b.durationTick - a.durationTick || b.pitch - a.pitch)[0];
    });
}

function activeSignature(song, tick) {
  const signatures = [...(song?.timeSignatures ?? [])]
    .filter((entry) => Number.isFinite(entry.tick) && entry.tick >= 0 && entry.numerator > 0 && entry.denominator > 0)
    .sort((a, b) => a.tick - b.tick);
  if (!signatures.length || signatures[0].tick > 0) signatures.unshift({ tick: 0, numerator: 4, denominator: 4, implicit: true });
  let active = signatures[0];
  for (const signature of signatures) {
    if (signature.tick > tick) break;
    active = signature;
  }
  return active;
}

function timingAtTick(song, tick) {
  const ppq = Number(song?.ppq);
  if (!Number.isFinite(ppq) || ppq <= 0) return null;
  const signature = activeSignature(song, tick);
  const unitTicks = ppq * 4 / signature.denominator;
  const compound = signature.numerator >= 6 && signature.numerator % 3 === 0;
  const musicalBeatTicks = compound ? unitTicks * 3 : unitTicks;
  const offset = mod(tick - signature.tick, musicalBeatTicks);
  const tolerance = Math.max(1, Math.round(ppq / 48));
  const distanceToBoundary = Math.min(offset, musicalBeatTicks - offset);
  return Object.freeze({
    signature,
    musicalBeatTicks,
    onBeat: distanceToBoundary <= tolerance,
  });
}

function chordCandidateForTick(chordSegments, tick) {
  const segment = (chordSegments ?? []).find((entry) => tick >= entry.startTick && tick < entry.endTick);
  if (!segment) return null;
  const selectedCandidate = segment.selectedCandidate
    ?? (segment.selected ? segment.candidates?.find((candidate) => candidate.value === segment.selected) : null);
  const candidate = segment.effectiveCandidate ?? selectedCandidate ?? segment.candidates?.[0] ?? null;
  if (!candidate) return null;
  const explicit = segment.selectionSource === 'selected' || Boolean(segment.selected || selectedCandidate);
  return { candidate, explicit };
}

function intervalsForCandidate(candidate) {
  return CHORD_INTERVALS[candidate?.quality] ?? Object.freeze([0]);
}

function chordToneInfo(note, chordSegments) {
  const context = chordCandidateForTick(chordSegments, note.startTick);
  if (!context) return null;
  const root = context.candidate.root;
  if (!Number.isInteger(root)) return null;
  const interval = mod(pitchClass(note.pitch) - root, 12);
  const chordTone = intervalsForCandidate(context.candidate).includes(interval);
  return { ...context, interval, chordTone };
}

function round(value, digits = 2) {
  if (!Number.isFinite(value)) return 0;
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

export function analyzeMelody(song, options = {}) {
  const trackId = options.trackId ?? getDefaultMelodyTrackId(song);
  const sourceNotes = trackNotes(song, trackId);
  const notes = representativeOnsets(sourceNotes, 'melody');
  if (!trackId || !notes.length) {
    return Object.freeze({
      trackId: trackId ?? null,
      noteCount: 0,
      sourceNoteCount: sourceNotes.length,
      note: 'Melody分析に使えるNoteがありません。対象Trackを選んでください。',
    });
  }

  const pitches = notes.map((note) => note.pitch);
  const leaps = notes.slice(1).map((note, index) => Math.abs(note.pitch - notes[index].pitch));
  const repeatedCount = leaps.filter((value) => value === 0).length;
  const lengthQuarters = Math.max(Number(song?.lengthTicks) / Number(song?.ppq), 0);

  let evaluated = 0;
  let chordToneCount = 0;
  let provisionalCount = 0;
  for (const note of notes) {
    const info = chordToneInfo(note, options.chordSegments);
    if (!info) continue;
    evaluated += 1;
    if (info.chordTone) chordToneCount += 1;
    if (!info.explicit) provisionalCount += 1;
  }

  return Object.freeze({
    trackId,
    noteCount: notes.length,
    sourceNoteCount: sourceNotes.length,
    range: Object.freeze({
      low: Math.min(...pitches),
      high: Math.max(...pitches),
      semitones: Math.max(...pitches) - Math.min(...pitches),
    }),
    leap: Object.freeze({
      averageSemitones: round(leaps.length ? leaps.reduce((sum, value) => sum + value, 0) / leaps.length : 0),
      maxSemitones: leaps.length ? Math.max(...leaps) : 0,
    }),
    repeated: Object.freeze({
      count: repeatedCount,
      ratio: round(leaps.length ? repeatedCount / leaps.length : 0, 4),
    }),
    density: Object.freeze({
      notesPerQuarter: round(lengthQuarters > 0 ? notes.length / lengthQuarters : 0),
    }),
    chordTone: Object.freeze({
      evaluated,
      chordTone: chordToneCount,
      nonChordTone: Math.max(0, evaluated - chordToneCount),
      ratio: round(evaluated ? chordToneCount / evaluated : 0, 4),
      provisionalCount,
    }),
    note: '同時発音は代表Note 1つにまとめてMelodyの動きを確認します。Chord Tone / Non-Chord Toneは特徴量で、正誤判定ではありません。',
  });
}

function classifyBassInterval(info) {
  if (!info) return null;
  const { candidate, interval } = info;
  if (interval === 0) return 'root';
  if ((THIRD_INTERVALS[candidate.quality] ?? []).includes(interval)) return 'third';
  if ((FIFTH_INTERVALS[candidate.quality] ?? []).includes(interval)) return 'fifth';
  return 'other';
}

export function analyzeBass(song, options = {}) {
  const trackId = options.trackId ?? getDefaultBassTrackId(song);
  const sourceNotes = trackNotes(song, trackId);
  const notes = representativeOnsets(sourceNotes, 'bass');
  if (!trackId || !notes.length) {
    return Object.freeze({
      trackId: trackId ?? null,
      noteCount: 0,
      sourceNoteCount: sourceNotes.length,
      note: 'Bass分析に使えるNoteがありません。対象Trackを選んでください。',
    });
  }

  const movements = notes.slice(1).map((note, index) => note.pitch - notes[index].pitch);
  const absoluteMovements = movements.map(Math.abs);
  const direction = movements.reduce((counts, value) => {
    if (value > 0) counts.up += 1;
    else if (value < 0) counts.down += 1;
    else counts.same += 1;
    return counts;
  }, { up: 0, down: 0, same: 0 });

  const roles = { root: 0, third: 0, fifth: 0, other: 0 };
  let evaluated = 0;
  let provisionalCount = 0;
  for (const note of notes) {
    const info = chordToneInfo(note, options.chordSegments);
    const role = classifyBassInterval(info);
    if (!role) continue;
    roles[role] += 1;
    evaluated += 1;
    if (!info.explicit) provisionalCount += 1;
  }

  const beatStates = notes.map((note) => timingAtTick(song, note.startTick)).filter(Boolean);
  const onBeatCount = beatStates.filter((entry) => entry.onBeat).length;
  const onBeatRatio = beatStates.length ? onBeatCount / beatStates.length : 0;
  const rhythmLabel = onBeatRatio >= 0.6 ? '拍頭中心' : onBeatRatio <= 0.3 ? '拍裏・細分中心' : '混合';

  return Object.freeze({
    trackId,
    noteCount: notes.length,
    sourceNoteCount: sourceNotes.length,
    movement: Object.freeze({
      averageSemitones: round(absoluteMovements.length ? absoluteMovements.reduce((sum, value) => sum + value, 0) / absoluteMovements.length : 0),
      maxSemitones: absoluteMovements.length ? Math.max(...absoluteMovements) : 0,
      up: direction.up,
      down: direction.down,
      same: direction.same,
    }),
    chordRole: Object.freeze({
      evaluated,
      root: roles.root,
      third: roles.third,
      fifth: roles.fifth,
      other: roles.other,
      rootRatio: round(evaluated ? roles.root / evaluated : 0, 4),
      thirdRatio: round(evaluated ? roles.third / evaluated : 0, 4),
      fifthRatio: round(evaluated ? roles.fifth / evaluated : 0, 4),
      otherRatio: round(evaluated ? roles.other / evaluated : 0, 4),
      provisionalCount,
    }),
    rhythm: Object.freeze({
      label: rhythmLabel,
      onBeatCount,
      offBeatCount: Math.max(0, beatStates.length - onBeatCount),
      onBeatRatio: round(onBeatRatio, 4),
    }),
    note: '各発音位置の最低音をBass代表Noteとして追います。Root / 3rd / 5th / Otherは現在のChord候補との関係です。',
  });
}

function uniqueOnsetTicks(notes) {
  return [...new Set(notes.map((note) => note.startTick).filter(Number.isFinite))].sort((a, b) => a - b);
}

function normalizeSignatures(song) {
  const signatures = [...(song?.timeSignatures ?? [])]
    .filter((entry) => Number.isFinite(entry.tick) && entry.tick >= 0 && entry.numerator > 0 && entry.denominator > 0)
    .sort((a, b) => a.tick - b.tick);
  if (!signatures.length || signatures[0].tick > 0) signatures.unshift({ tick: 0, numerator: 4, denominator: 4, implicit: true });
  return signatures;
}

function buildMeterGrids(song, onsets) {
  const ppq = Number(song?.ppq);
  const lengthTicks = Number(song?.lengthTicks);
  if (!Number.isFinite(ppq) || ppq <= 0 || !Number.isFinite(lengthTicks) || lengthTicks <= 0) return [];
  const sixteenthTicks = ppq / 4;
  const signatures = normalizeSignatures(song);

  return signatures.map((signature, index) => {
    const segmentStart = signature.tick;
    const segmentEnd = Math.min(lengthTicks, signatures[index + 1]?.tick ?? lengthTicks);
    const unitTicks = ppq * 4 / signature.denominator;
    const barTicks = unitTicks * signature.numerator;
    const cellCount = Math.max(1, Math.round(barTicks / sixteenthTicks));
    const cells = Array(cellCount).fill(0);
    for (const tick of onsets) {
      if (tick < segmentStart || tick >= segmentEnd) continue;
      const position = mod(tick - segmentStart, barTicks);
      const cell = mod(Math.round(position / sixteenthTicks), cellCount);
      cells[cell] += 1;
    }
    return Object.freeze({
      meter: `${signature.numerator}/${signature.denominator}`,
      startTick: segmentStart,
      endTick: segmentEnd,
      cellCount,
      cells: Object.freeze(cells),
    });
  });
}

export function analyzeRhythm(song, options = {}) {
  const trackIds = options.trackIds ?? getDefaultRhythmTrackIds(song);
  const selected = new Set(trackIds);
  const notes = (song?.notes ?? [])
    .filter((note) => selected.has(note.trackId) && note.durationTick > 0)
    .sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
  const onsets = uniqueOnsetTicks(notes);

  if (!trackIds.length || !onsets.length) {
    return Object.freeze({
      trackIds: Object.freeze([...trackIds]),
      noteCount: 0,
      onsetCount: 0,
      note: 'Rhythm分析に使えるNoteがありません。対象Trackを選んでください。',
    });
  }

  const beatStates = onsets.map((tick) => timingAtTick(song, tick)).filter(Boolean);
  const onBeatCount = beatStates.filter((entry) => entry.onBeat).length;
  const offBeatCount = Math.max(0, beatStates.length - onBeatCount);
  const lengthQuarters = Math.max(Number(song?.lengthTicks) / Number(song?.ppq), 0);

  return Object.freeze({
    trackIds: Object.freeze([...trackIds]),
    noteCount: notes.length,
    onsetCount: onsets.length,
    beatPosition: Object.freeze({
      onBeat: onBeatCount,
      offBeat: offBeatCount,
      onBeatRatio: round(beatStates.length ? onBeatCount / beatStates.length : 0, 4),
      syncopationCandidateCount: offBeatCount,
    }),
    density: Object.freeze({
      onsetsPerQuarter: round(lengthQuarters > 0 ? onsets.length / lengthQuarters : 0),
      notesPerQuarter: round(lengthQuarters > 0 ? notes.length / lengthQuarters : 0),
    }),
    meterGrids: Object.freeze(buildMeterGrids(song, onsets)),
    note: 'シンコペーションは拍頭以外の発音を「候補」として数えます。16分Gridは発音位置の分布で、良し悪しの採点ではありません。',
  });
}

export function formatMidiPitch(pitch) {
  if (!Number.isFinite(pitch)) return '—';
  const rounded = Math.round(pitch);
  const octave = Math.floor(rounded / 12) - 1;
  return `${PITCH_CLASS_NAMES[pitchClass(rounded)]}${octave}`;
}
