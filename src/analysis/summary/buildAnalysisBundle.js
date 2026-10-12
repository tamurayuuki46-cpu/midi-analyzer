import { analyzeBass, analyzeMelody, analyzeRhythm } from '../basic/index.js';
import { analyzeChords, buildTopChordProgression } from '../chord/index.js';
import { analyzePartDeep } from '../deep/index.js';
import { analyzeKeyScale } from '../key/index.js';
import { analyzeMotifs } from '../motif/index.js';
import { analyzeStructure } from '../structure/index.js';

function withEffectiveCandidates(segments = []) {
  return segments.map((segment) => Object.freeze({
    ...segment,
    effectiveCandidate: segment.effectiveCandidate ?? segment.selectedCandidate ?? segment.candidates?.[0] ?? null,
  }));
}

export function buildAnalysisBundle(song) {
  const key = analyzeKeyScale(song);
  const chords = analyzeChords(song);
  const chordSegments = Object.freeze(withEffectiveCandidates(chords.segments));
  const melody = analyzeMelody(song, { chordSegments });
  const bass = analyzeBass(song, { chordSegments });
  const rhythm = analyzeRhythm(song);
  const motif = analyzeMotifs(song);
  const structure = analyzeStructure(song);
  const deep = analyzePartDeep(song);
  const topChordProgression = buildTopChordProgression(chords.segments);

  return Object.freeze({
    generatedBy: 'midi-analyzer',
    schemaVersion: 1,
    source: Object.freeze({ ...(song?.source ?? {}) }),
    song: Object.freeze({
      ppq: Number(song?.ppq) || 0,
      lengthTicks: Number(song?.lengthTicks) || 0,
      trackCount: song?.tracks?.length ?? 0,
      noteCount: song?.notes?.length ?? 0,
      tempo: song?.tempoMap?.[0]?.bpm ?? null,
      timeSignature: song?.timeSignatures?.[0]
        ? `${song.timeSignatures[0].numerator}/${song.timeSignatures[0].denominator}`
        : null,
    }),
    key,
    chords: Object.freeze({ ...chords, segments: chordSegments }),
    topChordProgression,
    melody,
    bass,
    rhythm,
    motif,
    structure,
    deep,
    note: '各値はMIDIから得た解析候補です。Key / Chord / Section / 高度指標を自動確定するものではありません。',
  });
}
