const DEFAULT_MICROSECONDS_PER_BEAT = 500000;

function finitePositive(value) {
  return Number.isFinite(value) && value > 0;
}

function normalizedTempoMap(song) {
  const entries = [...(song?.tempoMap ?? [])]
    .filter((entry) => Number.isFinite(entry.tick) && entry.tick >= 0 && finitePositive(Number(entry.microsecondsPerBeat)))
    .map((entry) => ({
      tick: Number(entry.tick),
      microsecondsPerBeat: Number(entry.microsecondsPerBeat),
    }))
    .sort((a, b) => a.tick - b.tick);

  if (!entries.length || entries[0].tick > 0) {
    entries.unshift({ tick: 0, microsecondsPerBeat: DEFAULT_MICROSECONDS_PER_BEAT });
  }

  const deduped = [];
  for (const entry of entries) {
    const previous = deduped.at(-1);
    if (previous?.tick === entry.tick) deduped[deduped.length - 1] = entry;
    else deduped.push(entry);
  }
  return deduped;
}

export function buildTempoSegments(song) {
  const ppq = Number(song?.ppq);
  if (!finitePositive(ppq)) return Object.freeze([]);

  const tempos = normalizedTempoMap(song);
  const segments = [];
  let elapsedSeconds = 0;

  for (let index = 0; index < tempos.length; index += 1) {
    const current = tempos[index];
    const previous = tempos[index - 1];
    if (previous) {
      const tickDelta = current.tick - previous.tick;
      elapsedSeconds += (tickDelta / ppq) * (previous.microsecondsPerBeat / 1_000_000);
    }

    segments.push(Object.freeze({
      tick: current.tick,
      microsecondsPerBeat: current.microsecondsPerBeat,
      secondsAtTick: elapsedSeconds,
    }));
  }

  return Object.freeze(segments);
}

export function createTickToSeconds(song) {
  const ppq = Number(song?.ppq);
  const segments = buildTempoSegments(song);
  if (!finitePositive(ppq) || !segments.length) return () => 0;

  return (tick) => {
    const normalizedTick = Math.max(0, Number.isFinite(Number(tick)) ? Number(tick) : 0);
    let segment = segments[0];
    for (let index = 1; index < segments.length; index += 1) {
      if (segments[index].tick > normalizedTick) break;
      segment = segments[index];
    }

    const tickDelta = normalizedTick - segment.tick;
    return segment.secondsAtTick + (tickDelta / ppq) * (segment.microsecondsPerBeat / 1_000_000);
  };
}

export function midiPitchToFrequency(pitch) {
  if (!Number.isFinite(Number(pitch))) return 0;
  return 440 * (2 ** ((Number(pitch) - 69) / 12));
}

export function buildPlaybackSchedule(song) {
  const tickToSeconds = createTickToSeconds(song);
  const events = (song?.notes ?? [])
    .filter((note) => Number.isFinite(note.pitch)
      && Number.isFinite(note.startTick)
      && finitePositive(Number(note.durationTick)))
    .map((note) => {
      const startSeconds = tickToSeconds(note.startTick);
      const endSeconds = tickToSeconds(note.startTick + note.durationTick);
      return Object.freeze({
        id: note.id,
        pitch: note.pitch,
        velocity: Number.isFinite(note.velocity) ? note.velocity : 96,
        channel: note.channel,
        trackId: note.trackId,
        isDrums: note.channel === 9,
        startSeconds,
        endSeconds: Math.max(startSeconds + 0.01, endSeconds),
      });
    })
    .sort((a, b) => a.startSeconds - b.startSeconds || a.pitch - b.pitch || a.endSeconds - b.endSeconds);

  return Object.freeze(events);
}

export function playbackDurationSeconds(song) {
  const events = buildPlaybackSchedule(song);
  return events.length ? Math.max(...events.map((event) => event.endSeconds)) : 0;
}
