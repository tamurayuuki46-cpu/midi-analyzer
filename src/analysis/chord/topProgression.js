export function buildTopChordProgression(segments = []) {
  const progression = [];

  for (const segment of segments ?? []) {
    const candidate = segment?.candidates?.[0] ?? null;
    if (!candidate?.value) continue;

    progression.push(Object.freeze({
      segmentId: segment.id ?? null,
      barNumber: Number.isFinite(segment.barNumber) ? segment.barNumber : null,
      startTick: Number.isFinite(segment.startTick) ? segment.startTick : null,
      endTick: Number.isFinite(segment.endTick) ? segment.endTick : null,
      value: candidate.value,
      confidence: Number.isFinite(candidate.confidence) ? candidate.confidence : null,
    }));
  }

  return Object.freeze(progression);
}
