const PITCH_NAMES = Object.freeze(['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']);

const CHORD_TEMPLATES = Object.freeze([
  Object.freeze({ quality: 'major', suffix: '', intervals: Object.freeze([0, 4, 7]) }),
  Object.freeze({ quality: 'minor', suffix: 'm', intervals: Object.freeze([0, 3, 7]) }),
  Object.freeze({ quality: 'dim', suffix: 'dim', intervals: Object.freeze([0, 3, 6]) }),
  Object.freeze({ quality: 'aug', suffix: 'aug', intervals: Object.freeze([0, 4, 8]) }),
  Object.freeze({ quality: 'sus2', suffix: 'sus2', intervals: Object.freeze([0, 2, 7]) }),
  Object.freeze({ quality: 'sus4', suffix: 'sus4', intervals: Object.freeze([0, 5, 7]) }),
  Object.freeze({ quality: '7', suffix: '7', intervals: Object.freeze([0, 4, 7, 10]) }),
  Object.freeze({ quality: 'maj7', suffix: 'maj7', intervals: Object.freeze([0, 4, 7, 11]) }),
  Object.freeze({ quality: 'm7', suffix: 'm7', intervals: Object.freeze([0, 3, 7, 10]) }),
  Object.freeze({ quality: 'm7b5', suffix: 'm7♭5', intervals: Object.freeze([0, 3, 6, 10]) }),
]);

const BASS_BONUS = 1.5;
const NON_CHORD_PENALTY = 0.5;
const SWITCH_THRESHOLD = 0.10;

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function pitchClass(pitch) {
  return ((pitch % 12) + 12) % 12;
}

function chordName(root, template) {
  return `${PITCH_NAMES[root]}${template.suffix}`;
}

function selectedNotes(song, trackIds) {
  const selected = new Set(trackIds ?? []);
  return (song?.notes ?? []).filter((note) => note.channel !== 9 && selected.has(note.trackId) && note.durationTick > 0);
}

export function getDefaultChordTrackIds(song) {
  const usable = (song?.tracks ?? []).filter((track) => !track.isDrums && track.noteCount > 0);
  const hinted = usable.filter((track) => track.roleHint === 'chord');
  return Object.freeze((hinted.length ? hinted : usable).map((track) => track.id));
}

export function buildAnalysisWindows(song) {
  const ppq = Number(song?.ppq);
  const lengthTicks = Number(song?.lengthTicks);
  if (!Number.isFinite(ppq) || ppq <= 0 || !Number.isFinite(lengthTicks) || lengthTicks <= 0) return Object.freeze([]);

  const signatures = [...(song?.timeSignatures ?? [])]
    .filter((entry) => Number.isFinite(entry.tick) && entry.tick >= 0 && entry.numerator > 0 && entry.denominator > 0)
    .sort((a, b) => a.tick - b.tick);

  if (!signatures.length || signatures[0].tick > 0) {
    signatures.unshift({ tick: 0, numerator: 4, denominator: 4, implicit: true });
  }

  const windows = [];
  let barNumber = 1;
  for (let signatureIndex = 0; signatureIndex < signatures.length; signatureIndex += 1) {
    const signature = signatures[signatureIndex];
    const segmentStart = Math.max(0, signature.tick);
    const segmentEnd = Math.min(lengthTicks, signatures[signatureIndex + 1]?.tick ?? lengthTicks);
    if (segmentEnd <= segmentStart) continue;

    const gridTicks = ppq * 4 / signature.denominator;
    if (!Number.isFinite(gridTicks) || gridTicks <= 0) continue;
    const barTicks = gridTicks * signature.numerator;
    const compound = signature.numerator >= 6 && signature.numerator % 3 === 0;
    const musicalBeatTicks = compound ? gridTicks * 3 : gridTicks;

    for (let barStart = segmentStart; barStart < segmentEnd; barStart += barTicks) {
      const currentBarEnd = Math.min(segmentEnd, barStart + barTicks);
      let gridIndex = 0;
      for (let startTick = barStart; startTick < currentBarEnd; startTick += gridTicks) {
        const endTick = Math.min(currentBarEnd, startTick + gridTicks);
        windows.push(Object.freeze({
          id: `grid-${Math.round(startTick)}-${Math.round(endTick)}`,
          startTick,
          endTick,
          barNumber,
          gridIndex,
          gridTicks,
          musicalBeatTicks,
          numerator: signature.numerator,
          denominator: signature.denominator,
        }));
        gridIndex += 1;
      }
      barNumber += 1;
    }
  }

  return Object.freeze(windows);
}

function windowNoteData(notes, startTick, endTick) {
  const weights = Array(12).fill(0);
  let lowestPitch = null;
  let lowestWeight = 0;

  for (const note of notes) {
    const overlapStart = Math.max(startTick, note.startTick);
    const overlapEnd = Math.min(endTick, note.startTick + note.durationTick);
    const overlap = overlapEnd - overlapStart;
    if (overlap <= 0) continue;

    const weight = overlap * note.velocity;
    weights[pitchClass(note.pitch)] += weight;
    if (lowestPitch === null || note.pitch < lowestPitch) {
      lowestPitch = note.pitch;
      lowestWeight = weight;
    } else if (note.pitch === lowestPitch) {
      lowestWeight += weight;
    }
  }

  return { weights, lowestPitch, lowestWeight };
}

function scoreCandidates(data) {
  const totalWeight = data.weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight <= 0) return [];
  const bassPitchClass = data.lowestPitch === null ? null : pitchClass(data.lowestPitch);
  const ranked = [];

  for (let root = 0; root < 12; root += 1) {
    for (const template of CHORD_TEMPLATES) {
      const chordPcs = template.intervals.map((interval) => (root + interval) % 12);
      const chordToneWeight = chordPcs.reduce((sum, pc) => sum + data.weights[pc], 0);
      const nonChordWeight = Math.max(0, totalWeight - chordToneWeight);
      const supportCount = chordPcs.filter((pc) => data.weights[pc] > 0).length;
      const supportRatio = supportCount / chordPcs.length;
      const sparseFactor = Math.min(1, supportCount / 3);
      const missingTonePenalty = (template.intervals.length - supportCount) * totalWeight * 0.08;
      const rootBonus = bassPitchClass === root ? BASS_BONUS * data.lowestWeight : 0;
      const rawScore = chordToneWeight - NON_CHORD_PENALTY * nonChordWeight + rootBonus - missingTonePenalty;
      const fit = chordToneWeight / totalWeight;
      const confidence = clamp01((fit - NON_CHORD_PENALTY * (nonChordWeight / totalWeight) + (bassPitchClass === root ? 0.08 : 0)) * sparseFactor * supportRatio);

      ranked.push({
        value: chordName(root, template),
        root,
        quality: template.quality,
        confidence: Number(confidence.toFixed(4)),
        rawScore,
        supportCount,
      });
    }
  }

  return ranked.sort((a, b) => b.rawScore - a.rawScore || b.confidence - a.confidence || a.value.localeCompare(b.value));
}

function stabilizeWindows(analyzedWindows) {
  let previousValue = null;
  return analyzedWindows.map((entry) => {
    if (!entry.ranked.length) {
      previousValue = null;
      return { ...entry, effective: null };
    }

    let effective = entry.ranked[0];
    if (previousValue && effective.value !== previousValue) {
      const previousCandidate = entry.ranked.find((candidate) => candidate.value === previousValue);
      if (previousCandidate) {
        const lead = effective.rawScore - previousCandidate.rawScore;
        const requiredLead = Math.max(Math.abs(effective.rawScore), 1) * SWITCH_THRESHOLD;
        if (lead < requiredLead) effective = previousCandidate;
      }
    }
    previousValue = effective.value;
    return { ...entry, effective };
  });
}

function publicCandidate(candidate) {
  return Object.freeze({
    value: candidate.value,
    root: candidate.root,
    quality: candidate.quality,
    confidence: candidate.confidence,
  });
}

function analyzeRange(notes, startTick, endTick) {
  return scoreCandidates(windowNoteData(notes, startTick, endTick));
}

function groupWindows(stabilized, notes) {
  const groups = [];
  for (const entry of stabilized) {
    if (!entry.effective) continue;
    const previous = groups.at(-1);
    const sameChord = previous && previous.effectiveValue === entry.effective.value && previous.barNumber === entry.window.barNumber && previous.endTick === entry.window.startTick;
    if (sameChord) {
      previous.endTick = entry.window.endTick;
      previous.endGridIndex = entry.window.gridIndex;
      continue;
    }
    groups.push({
      effectiveValue: entry.effective.value,
      startTick: entry.window.startTick,
      endTick: entry.window.endTick,
      barNumber: entry.window.barNumber,
      startGridIndex: entry.window.gridIndex,
      endGridIndex: entry.window.gridIndex,
      numerator: entry.window.numerator,
      denominator: entry.window.denominator,
      musicalBeatTicks: entry.window.musicalBeatTicks,
    });
  }

  return groups.map((group, index) => {
    const ranked = analyzeRange(notes, group.startTick, group.endTick);
    const preferred = ranked.find((candidate) => candidate.value === group.effectiveValue);
    const ordered = preferred ? [preferred, ...ranked.filter((candidate) => candidate.value !== preferred.value)] : ranked;
    return Object.freeze({
      id: `chord-${index + 1}-${Math.round(group.startTick)}`,
      startTick: group.startTick,
      endTick: group.endTick,
      barNumber: group.barNumber,
      startGridIndex: group.startGridIndex,
      endGridIndex: group.endGridIndex,
      numerator: group.numerator,
      denominator: group.denominator,
      musicalBeatTicks: group.musicalBeatTicks,
      candidates: Object.freeze(ordered.slice(0, 3).map(publicCandidate)),
      selected: null,
    });
  });
}

export function analyzeChords(song, options = {}) {
  const trackIds = options.trackIds ?? getDefaultChordTrackIds(song);
  const notes = selectedNotes(song, trackIds);
  if (!trackIds.length || !notes.length) {
    return Object.freeze({
      trackIds: Object.freeze([...trackIds]),
      segments: Object.freeze([]),
      selected: null,
      note: '選択したTrackに分析できるNoteがありません。Chord分析対象Trackを選んでください。',
      parameters: Object.freeze({ bassBonus: BASS_BONUS, nonChordPenalty: NON_CHORD_PENALTY, switchThreshold: SWITCH_THRESHOLD }),
    });
  }

  const windows = buildAnalysisWindows(song);
  const analyzedWindows = windows.map((window) => ({ window, ranked: analyzeRange(notes, window.startTick, window.endTick) }));
  const stabilized = stabilizeWindows(analyzedWindows);
  const segments = groupWindows(stabilized, notes);

  return Object.freeze({
    trackIds: Object.freeze([...trackIds]),
    segments: Object.freeze(segments),
    selected: null,
    note: 'Chord候補は選択Trackの重なり音から計算した候補です。confidenceは確率ではありません。',
    parameters: Object.freeze({ bassBonus: BASS_BONUS, nonChordPenalty: NON_CHORD_PENALTY, switchThreshold: SWITCH_THRESHOLD }),
  });
}

export function degreeForPitchClass(rootPitchClass, keyValue) {
  if (!Number.isInteger(rootPitchClass) || rootPitchClass < 0 || rootPitchClass > 11 || typeof keyValue !== 'string') return null;
  const match = keyValue.match(/^(.+?)\s+(major|minor)$/);
  if (!match) return null;
  const tonic = PITCH_NAMES.indexOf(match[1]);
  if (tonic < 0) return null;
  const scale = match[2];
  const relative = (rootPitchClass - tonic + 12) % 12;

  const majorMap = new Map([[0, 'I'], [2, 'II'], [4, 'III'], [5, 'IV'], [7, 'V'], [9, 'VI'], [11, 'VII']]);
  const minorMap = new Map([[0, 'I'], [2, 'II'], [3, 'III'], [5, 'IV'], [7, 'V'], [8, 'VI'], [10, 'VII']]);
  const map = scale === 'major' ? majorMap : minorMap;
  if (map.has(relative)) return Object.freeze({ value: map.get(relative), outOfScale: false });

  const majorChromatic = new Map([[1, '♭II'], [3, '♭III'], [6, '♭V'], [8, '♭VI'], [10, '♭VII']]);
  const minorChromatic = new Map([[1, '♭II'], [4, '♯III'], [6, '♯IV'], [9, '♯VI'], [11, '♯VII']]);
  return Object.freeze({
    value: (scale === 'major' ? majorChromatic : minorChromatic).get(relative) ?? '?',
    outOfScale: true,
  });
}
