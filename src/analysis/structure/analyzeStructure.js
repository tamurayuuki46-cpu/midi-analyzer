import { buildAnalysisWindows } from '../chord/index.js';
import { analyzeKeyScale } from '../key/index.js';

const DEFAULT_BLOCK_BARS = 4;
const SECTION_SIMILARITY_THRESHOLD = 0.82;
const PITCH_NAMES = Object.freeze(['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']);

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function activeNotes(song, startTick, endTick) {
  return (song?.notes ?? []).filter((note) => note.channel !== 9 && note.durationTick > 0 && note.startTick < endTick && note.startTick + note.durationTick > startTick);
}

function clippedSong(song, startTick, endTick) {
  const notes = activeNotes(song, startTick, endTick).map((note) => {
    const overlapStart = Math.max(startTick, note.startTick);
    const overlapEnd = Math.min(endTick, note.startTick + note.durationTick);
    return { ...note, startTick: overlapStart - startTick, durationTick: Math.max(0, overlapEnd - overlapStart) };
  });
  return { ...song, lengthTicks: endTick - startTick, notes };
}

function pitchClassVector(notes) {
  const vector = Array(12).fill(0);
  for (const note of notes) {
    const pc = ((note.pitch % 12) + 12) % 12;
    vector[pc] += note.durationTick * note.velocity;
  }
  const total = vector.reduce((sum, value) => sum + value, 0);
  return total > 0 ? vector.map((value) => value / total) : vector;
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let aa = 0;
  let bb = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    aa += a[index] ** 2;
    bb += b[index] ** 2;
  }
  if (!aa || !bb) return 0;
  return clamp01(dot / Math.sqrt(aa * bb));
}

function similarityRatio(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  if (a === 0 && b === 0) return 1;
  const max = Math.max(Math.abs(a), Math.abs(b), 1e-9);
  return clamp01(1 - Math.abs(a - b) / max);
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function blockFeatures(song, block) {
  const notes = activeNotes(song, block.startTick, block.endTick);
  const ppq = Number(song?.ppq) || 480;
  const quarters = Math.max((block.endTick - block.startTick) / ppq, 1e-9);
  const weightedVelocity = notes.reduce((sum, note) => sum + note.velocity, 0);
  return Object.freeze({
    pitchVector: Object.freeze(pitchClassVector(notes)),
    density: notes.length / quarters,
    averagePitch: average(notes.map((note) => note.pitch)),
    averageVelocity: notes.length ? weightedVelocity / notes.length : 0,
    noteCount: notes.length,
  });
}

function featureSimilarity(a, b) {
  const pitch = cosineSimilarity(a.pitchVector, b.pitchVector);
  const density = similarityRatio(a.density, b.density);
  const register = clamp01(1 - Math.abs(a.averagePitch - b.averagePitch) / 24);
  const velocity = similarityRatio(a.averageVelocity, b.averageVelocity);
  return 0.60 * pitch + 0.18 * density + 0.14 * register + 0.08 * velocity;
}

function buildBarRanges(song) {
  const windows = buildAnalysisWindows(song);
  const grouped = new Map();
  for (const window of windows) {
    const current = grouped.get(window.barNumber) ?? {
      barNumber: window.barNumber,
      startTick: window.startTick,
      endTick: window.endTick,
    };
    current.startTick = Math.min(current.startTick, window.startTick);
    current.endTick = Math.max(current.endTick, window.endTick);
    grouped.set(window.barNumber, current);
  }
  return [...grouped.values()].sort((a, b) => a.barNumber - b.barNumber);
}

function buildBlocks(song, blockBars) {
  const bars = buildBarRanges(song);
  const blocks = [];
  for (let index = 0; index < bars.length; index += blockBars) {
    const chunk = bars.slice(index, index + blockBars);
    if (!chunk.length) continue;
    blocks.push({
      id: `block-${blocks.length + 1}`,
      startBar: chunk[0].barNumber,
      endBar: chunk.at(-1).barNumber,
      startTick: chunk[0].startTick,
      endTick: chunk.at(-1).endTick,
    });
  }
  return blocks;
}

function sectionLabel(index) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (index < alphabet.length) return alphabet[index];
  return `S${index + 1}`;
}

function classifySections(song, blocks) {
  const prototypes = [];
  return blocks.map((block) => {
    const features = blockFeatures(song, block);
    let bestIndex = -1;
    let bestSimilarity = -1;
    prototypes.forEach((prototype, index) => {
      const similarity = featureSimilarity(features, prototype.features);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestIndex = index;
      }
    });

    if (bestIndex < 0 || bestSimilarity < SECTION_SIMILARITY_THRESHOLD) {
      bestIndex = prototypes.length;
      bestSimilarity = 1;
      prototypes.push({ features });
    }

    return Object.freeze({
      ...block,
      label: sectionLabel(bestIndex),
      similarity: Number(bestSimilarity.toFixed(4)),
      metrics: Object.freeze({
        noteCount: features.noteCount,
        density: Number(features.density.toFixed(2)),
        averagePitch: Number(features.averagePitch.toFixed(2)),
        averageVelocity: Number(features.averageVelocity.toFixed(2)),
      }),
    });
  });
}

function parseKey(value) {
  const match = typeof value === 'string' ? value.match(/^(.+?)\s+(major|minor)$/) : null;
  if (!match) return null;
  const root = PITCH_NAMES.indexOf(match[1]);
  if (root < 0) return null;
  return { root, scale: match[2] };
}

function relationBetweenKeys(fromValue, toValue) {
  const from = parseKey(fromValue);
  const to = parseKey(toValue);
  if (!from || !to) return 'other';
  if (from.root === to.root && from.scale !== to.scale) return 'parallel';
  const interval = (to.root - from.root + 12) % 12;
  if (from.scale === 'major' && to.scale === 'minor' && interval === 9) return 'relative';
  if (from.scale === 'minor' && to.scale === 'major' && interval === 3) return 'relative';
  if (interval === 7) return 'dominant';
  if (interval === 5) return 'subdominant';
  if (interval === 1 || interval === 11) return 'semitone';
  if (interval === 2 || interval === 10) return 'whole-tone';
  return 'other';
}

function analyzeKeyTimeline(song, blocks) {
  return blocks.map((block) => {
    const analysis = analyzeKeyScale(clippedSong(song, block.startTick, block.endTick));
    const top = analysis.candidates[0] ?? null;
    return Object.freeze({
      blockId: block.id,
      startBar: block.startBar,
      endBar: block.endBar,
      startTick: block.startTick,
      endTick: block.endTick,
      candidates: analysis.candidates,
      effective: top,
    });
  });
}

function modulationCandidates(timeline) {
  const result = [];
  for (let index = 1; index < timeline.length; index += 1) {
    const previous = timeline[index - 1];
    const current = timeline[index];
    if (!previous.effective || !current.effective || previous.effective.value === current.effective.value) continue;
    result.push(Object.freeze({
      id: `modulation-${result.length + 1}`,
      atBar: current.startBar,
      from: previous.effective.value,
      to: current.effective.value,
      relation: relationBetweenKeys(previous.effective.value, current.effective.value),
      confidence: Number(Math.min(previous.effective.confidence, current.effective.confidence).toFixed(4)),
    }));
  }
  return result;
}

export function analyzeStructure(song, options = {}) {
  const blockBars = Math.max(2, Math.min(16, Math.round(options.blockBars ?? DEFAULT_BLOCK_BARS)));
  const blocks = buildBlocks(song, blockBars);
  if (!blocks.length) {
    return Object.freeze({
      sections: Object.freeze([]),
      keyTimeline: Object.freeze([]),
      modulations: Object.freeze([]),
      note: 'Section分析に使える小節情報がありません。',
      parameters: Object.freeze({ blockBars, sectionSimilarityThreshold: SECTION_SIMILARITY_THRESHOLD }),
    });
  }

  const sections = classifySections(song, blocks);
  const keyTimeline = analyzeKeyTimeline(song, blocks);
  const modulations = modulationCandidates(keyTimeline);
  return Object.freeze({
    sections: Object.freeze(sections),
    keyTimeline: Object.freeze(keyTimeline),
    modulations: Object.freeze(modulations),
    note: `${blockBars}小節単位の特徴量と区間KeyからSection / 転調候補を表示しています。確定判定ではありません。`,
    parameters: Object.freeze({ blockBars, sectionSimilarityThreshold: SECTION_SIMILARITY_THRESHOLD }),
  });
}
