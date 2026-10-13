const MAJOR_PROFILE = Object.freeze([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]);
const MINOR_PROFILE = Object.freeze([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]);
const PITCH_NAMES = Object.freeze(['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']);
const CLOSE_THRESHOLD = 0.10;

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let aa = 0;
  let bb = 0;
  for (let index = 0; index < 12; index += 1) {
    dot += a[index] * b[index];
    aa += a[index] * a[index];
    bb += b[index] * b[index];
  }
  if (!aa || !bb) return 0;
  return dot / Math.sqrt(aa * bb);
}

function rotateProfile(profile, root) {
  return Array.from({ length: 12 }, (_, pitchClass) => profile[(pitchClass - root + 12) % 12]);
}

export function buildPitchClassWeights(song) {
  const weights = Array(12).fill(0);
  for (const note of song?.notes ?? []) {
    if (note.channel === 9) continue;
    const duration = Number(note.durationTick);
    const velocity = Number(note.velocity);
    if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(velocity) || velocity <= 0) continue;
    const pitchClass = ((note.pitch % 12) + 12) % 12;
    weights[pitchClass] += duration * velocity;
  }
  return weights;
}

function label(root, scale) {
  return `${PITCH_NAMES[root]} ${scale}`;
}

function candidateScores(weights) {
  const candidates = [];
  for (let root = 0; root < 12; root += 1) {
    for (const [scale, profile] of [['major', MAJOR_PROFILE], ['minor', MINOR_PROFILE]]) {
      const score = cosineSimilarity(weights, rotateProfile(profile, root));
      candidates.push({
        value: label(root, scale),
        confidence: Number(clamp01(score).toFixed(4)),
        root,
        scale,
        score,
      });
    }
  }
  return candidates.sort((a, b) => b.score - a.score || a.root - b.root || a.scale.localeCompare(b.scale));
}

function windowWeights(song, startTick, endTick) {
  const weights = Array(12).fill(0);
  for (const note of song?.notes ?? []) {
    if (note.channel === 9) continue;
    const overlapStart = Math.max(startTick, note.startTick);
    const overlapEnd = Math.min(endTick, note.startTick + note.durationTick);
    const overlap = overlapEnd - overlapStart;
    if (overlap <= 0) continue;
    const pitchClass = ((note.pitch % 12) + 12) % 12;
    weights[pitchClass] += overlap * note.velocity;
  }
  return weights;
}

function triadFromWeights(weights) {
  let best = null;
  for (let root = 0; root < 12; root += 1) {
    for (const [scale, third] of [['major', 4], ['minor', 3]]) {
      const pitchClasses = [root, (root + third) % 12, (root + 7) % 12];
      if (!pitchClasses.every((pitchClass) => weights[pitchClass] > 0)) continue;
      const score = pitchClasses.reduce((sum, pitchClass) => sum + weights[pitchClass], 0);
      if (!best || score > best.score) best = { value: label(root, scale), score };
    }
  }
  return best;
}

function ambiguityHint(song, candidates) {
  if (candidates.length < 2) return null;
  const top = candidates[0].score;
  const relativeGap = top > 0 ? (top - candidates[1].score) / top : 1;
  if (relativeGap > CLOSE_THRESHOLD) return null;

  const notes = (song?.notes ?? []).filter((note) => note.channel !== 9 && note.durationTick > 0);
  if (!notes.length) return null;

  const firstTick = Math.min(...notes.map((note) => note.startTick));
  const lastTick = Math.max(...notes.map((note) => note.startTick + note.durationTick));
  const windowSize = Math.max(song?.ppq ?? 480, 1) * 2;
  const firstChord = triadFromWeights(windowWeights(song, firstTick, firstTick + windowSize));
  const lastChord = triadFromWeights(windowWeights(song, Math.max(firstTick, lastTick - windowSize), lastTick));
  const parts = [];
  if (firstChord) parts.push(`始まり付近: ${firstChord.value}`);
  if (lastChord) parts.push(`終わり付近: ${lastChord.value}`);

  if (!parts.length) {
    return '上位2候補が近い状態です。始まり・終わり付近にも明確な三和音は見つからなかったため、候補順位はそのままです。';
  }
  return `上位2候補が近いため補助ヒント: ${parts.join(' / ')}。このヒントは候補順位には反映していません。`;
}

export function analyzeKeyScale(song) {
  const weights = buildPitchClassWeights(song);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight <= 0) {
    return Object.freeze({
      candidates: Object.freeze([]),
      selected: null,
      note: 'Drums以外のNoteがないため、Key / Scale候補を計算できません。',
      hint: null,
    });
  }

  const ranked = candidateScores(weights);
  const candidates = ranked.slice(0, 3).map(({ value, confidence }) => Object.freeze({ value, confidence }));
  return Object.freeze({
    candidates: Object.freeze(candidates),
    selected: null,
    note: '上位3候補です。confidenceは確率ではなく、音の分布とKey profileの一致度です。',
    hint: ambiguityHint(song, ranked),
  });
}
