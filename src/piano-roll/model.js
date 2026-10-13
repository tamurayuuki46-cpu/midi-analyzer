export const ZOOM_LEVELS = Object.freeze([24, 36, 52, 72]);

export function formatMidiNoteName(pitch) {
  if (!Number.isInteger(pitch) || pitch < 0 || pitch > 127) return '—';
  const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
  return `${names[pitch % 12]}${Math.floor(pitch / 12) - 1}`;
}

export function getTrackNotes(song, trackId) {
  if (!song?.notes || !trackId) return [];
  return song.notes
    .filter((note) => note.trackId === trackId)
    .slice()
    .sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch || a.durationTick - b.durationTick);
}

export function getDefaultTrackId(song) {
  const tracks = song?.tracks ?? [];
  const withNotes = tracks.filter((track) => track.noteCount > 0);
  return (
    withNotes.find((track) => !track.isDrums)?.id
    ?? withNotes[0]?.id
    ?? tracks[0]?.id
    ?? null
  );
}

export function getPitchRange(notes, { padding = 2, minimumSpan = 12 } = {}) {
  if (!notes.length) {
    return { minPitch: 60, maxPitch: 71 };
  }

  let minPitch = Math.max(0, Math.min(...notes.map((note) => note.pitch)) - padding);
  let maxPitch = Math.min(127, Math.max(...notes.map((note) => note.pitch)) + padding);

  const currentSpan = maxPitch - minPitch + 1;
  if (currentSpan < minimumSpan) {
    let missing = minimumSpan - currentSpan;
    const lowerRoom = minPitch;
    const addLower = Math.min(lowerRoom, Math.ceil(missing / 2));
    minPitch -= addLower;
    missing -= addLower;

    const upperRoom = 127 - maxPitch;
    const addUpper = Math.min(upperRoom, missing);
    maxPitch += addUpper;
    missing -= addUpper;

    if (missing > 0) {
      minPitch = Math.max(0, minPitch - missing);
    }
  }

  return { minPitch, maxPitch };
}

export function buildTimelineMarkers(song) {
  const ppq = song?.ppq;
  const lengthTicks = Math.max(0, song?.lengthTicks ?? 0);
  if (!Number.isFinite(ppq) || ppq <= 0 || lengthTicks <= 0) return [];

  const signatures = (song.timeSignatures?.length
    ? song.timeSignatures
    : [{ tick: 0, numerator: 4, denominator: 4 }])
    .slice()
    .sort((a, b) => a.tick - b.tick);

  if (signatures[0].tick > 0) {
    signatures.unshift({ tick: 0, numerator: 4, denominator: 4, implicit: true });
  }

  const markers = [];
  let barNumber = 1;

  for (let index = 0; index < signatures.length; index += 1) {
    const signature = signatures[index];
    const segmentStart = Math.max(0, signature.tick);
    if (segmentStart >= lengthTicks) break;

    const nextSignature = signatures[index + 1];
    const segmentEnd = Math.min(lengthTicks, nextSignature?.tick ?? lengthTicks);
    const numerator = Math.max(1, Number(signature.numerator) || 4);
    const denominator = Math.max(1, Number(signature.denominator) || 4);
    const beatTicks = ppq * 4 / denominator;
    const barTicks = beatTicks * numerator;

    if (!Number.isFinite(beatTicks) || beatTicks <= 0 || !Number.isFinite(barTicks) || barTicks <= 0) {
      continue;
    }

    for (let barStart = segmentStart; barStart < segmentEnd; barStart += barTicks) {
      markers.push({ tick: barStart, kind: 'bar', label: String(barNumber) });
      barNumber += 1;

      for (let beat = 1; beat < numerator; beat += 1) {
        const tick = barStart + beat * beatTicks;
        if (tick >= segmentEnd || tick >= lengthTicks) break;
        markers.push({ tick, kind: 'beat', label: null });
      }
    }
  }

  const byTick = new Map();
  for (const marker of markers) {
    const existing = byTick.get(marker.tick);
    if (!existing || marker.kind === 'bar') byTick.set(marker.tick, marker);
  }

  return [...byTick.values()].sort((a, b) => a.tick - b.tick);
}
