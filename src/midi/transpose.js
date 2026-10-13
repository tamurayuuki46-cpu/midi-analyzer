const NOTE_TO_PC = Object.freeze({ C:0, 'C#':1, Db:1, D:2, 'D#':3, Eb:3, E:4, F:5, 'F#':6, Gb:6, G:7, 'G#':8, Ab:8, A:9, 'A#':10, Bb:10, B:11 });
const PC_NAMES = Object.freeze(['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']);
const SCALES = Object.freeze({ major:[0,2,4,5,7,9,11], minor:[0,2,3,5,7,8,10] });

function clampMidi(value) { return Math.max(0, Math.min(127, Math.round(value))); }
function mod12(value) { return ((value % 12) + 12) % 12; }

export function parseKey(value) {
  const match = String(value || '').trim().match(/^([A-Ga-g])([#b]?)(?:\s+|-)?(major|minor|maj|min)?$/i);
  if (!match) throw new Error(`Keyを解釈できません: ${value}`);
  const tonicName = `${match[1].toUpperCase()}${match[2] || ''}`;
  const tonic = NOTE_TO_PC[tonicName];
  if (tonic === undefined) throw new Error(`Keyを解釈できません: ${value}`);
  const rawMode = String(match[3] || 'major').toLowerCase();
  const mode = rawMode === 'minor' || rawMode === 'min' ? 'minor' : 'major';
  return Object.freeze({ tonic, mode, name: `${PC_NAMES[tonic]} ${mode}` });
}

export function transposeNotesChromatic(notes, semitones) {
  const shift = Math.max(-24, Math.min(24, Math.round(Number(semitones) || 0)));
  return (notes || []).map((note) => ({ ...note, pitchMidi: clampMidi(Number(note.pitchMidi) + shift) }));
}

function nearestScaleDegree(pc, tonic, intervals) {
  let best = { degree: 0, accidental: 0, distance: Infinity };
  intervals.forEach((interval, degree) => {
    const target = mod12(tonic + interval);
    let diff = mod12(pc - target);
    if (diff > 6) diff -= 12;
    const distance = Math.abs(diff);
    if (distance < best.distance || (distance === best.distance && Math.abs(diff) < Math.abs(best.accidental))) {
      best = { degree, accidental: diff, distance };
    }
  });
  return best;
}

export function transposeNotesDegreePreserve(notes, sourceKey, targetKey) {
  const source = parseKey(sourceKey);
  const target = parseKey(targetKey);
  const sourceScale = SCALES[source.mode];
  const targetScale = SCALES[target.mode];

  return (notes || []).map((note) => {
    const pitch = Math.round(Number(note.pitchMidi) || 0);
    const pc = mod12(pitch);
    const { degree, accidental } = nearestScaleDegree(pc, source.tonic, sourceScale);
    const targetPc = mod12(target.tonic + targetScale[degree] + accidental);
    const sourceRelative = pitch - source.tonic;
    const octaveBand = Math.floor(sourceRelative / 12);
    let candidate = target.tonic + octaveBand * 12 + targetScale[degree] + accidental;
    while (mod12(candidate) !== targetPc) candidate += 12;
    while (candidate - pitch > 6) candidate -= 12;
    while (pitch - candidate > 6) candidate += 12;
    return { ...note, pitchMidi: clampMidi(candidate) };
  });
}

export function transposeNotesToKey(notes, sourceKey, targetKey, mode = 'degree') {
  if (mode === 'chromatic') {
    const source = parseKey(sourceKey);
    const target = parseKey(targetKey);
    let shift = target.tonic - source.tonic;
    if (shift > 6) shift -= 12;
    if (shift < -6) shift += 12;
    return transposeNotesChromatic(notes, shift);
  }
  return transposeNotesDegreePreserve(notes, sourceKey, targetKey);
}

export function generate12KeyVariants(notes, sourceKey, mode = 'degree') {
  const source = parseKey(sourceKey);
  return PC_NAMES.map((tonic, pc) => ({
    key: `${tonic} ${source.mode}`,
    tonic,
    pitchClass: pc,
    notes: transposeNotesToKey(notes, source.name, `${tonic} ${source.mode}`, mode),
  }));
}

export const KEY_NAMES = PC_NAMES;
