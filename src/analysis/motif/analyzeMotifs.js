import { getDefaultMelodyTrackId } from '../basic/index.js';

const DEFAULT_NOTE_LENGTH = 4;
const MAX_MOTIFS = 8;

function representativeOnsets(notes) {
  const groups = new Map();
  for (const note of notes) {
    if (note.durationTick <= 0 || note.channel === 9) continue;
    const bucket = groups.get(note.startTick) ?? [];
    bucket.push(note);
    groups.set(note.startTick, bucket);
  }

  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, bucket]) => [...bucket].sort((a, b) => b.velocity - a.velocity || b.durationTick - a.durationTick || b.pitch - a.pitch)[0]);
}

function trackNotes(song, trackId) {
  return representativeOnsets((song?.notes ?? []).filter((note) => note.trackId === trackId));
}

function quantizedBeatDelta(deltaTick, ppq) {
  if (!Number.isFinite(ppq) || ppq <= 0) return 0;
  const beats = deltaTick / ppq;
  return Math.round(beats * 4) / 4;
}

function motifSignature(notes, ppq) {
  const intervals = [];
  const rhythm = [];
  for (let index = 1; index < notes.length; index += 1) {
    intervals.push(notes[index].pitch - notes[index - 1].pitch);
    rhythm.push(quantizedBeatDelta(notes[index].startTick - notes[index - 1].startTick, ppq));
  }
  return `${intervals.join(',')}|${rhythm.join(',')}`;
}

function occurrenceFromWindow(window) {
  const last = window.at(-1);
  return Object.freeze({
    startTick: window[0].startTick,
    endTick: last.startTick + last.durationTick,
    firstPitch: window[0].pitch,
    pitches: Object.freeze(window.map((note) => note.pitch)),
  });
}

function collapseOverlappingOccurrences(occurrences) {
  const ordered = [...occurrences].sort((a, b) => a.startTick - b.startTick || a.endTick - b.endTick);
  const kept = [];
  for (const occurrence of ordered) {
    const previous = kept.at(-1);
    if (previous && occurrence.startTick < previous.endTick) continue;
    kept.push(occurrence);
  }
  return kept;
}

export function analyzeMotifs(song, options = {}) {
  const trackId = options.trackId ?? getDefaultMelodyTrackId(song);
  const noteLength = Math.max(3, Math.min(8, Math.round(options.noteLength ?? DEFAULT_NOTE_LENGTH)));
  const maxMotifs = Math.max(1, Math.min(20, Math.round(options.maxMotifs ?? MAX_MOTIFS)));
  const notes = trackId ? trackNotes(song, trackId) : [];

  if (!trackId || notes.length < noteLength * 2) {
    return Object.freeze({
      trackId: trackId ?? null,
      motifs: Object.freeze([]),
      note: `Motif候補には同一Track上で最低${noteLength * 2}個程度の代表Noteが必要です。`,
      parameters: Object.freeze({ noteLength, maxMotifs }),
    });
  }

  const grouped = new Map();
  for (let index = 0; index <= notes.length - noteLength; index += 1) {
    const window = notes.slice(index, index + noteLength);
    const signature = motifSignature(window, song.ppq);
    const entry = grouped.get(signature) ?? { signature, occurrences: [], representative: window };
    entry.occurrences.push(occurrenceFromWindow(window));
    grouped.set(signature, entry);
  }

  const motifs = [...grouped.values()]
    .map((entry) => ({ ...entry, occurrences: collapseOverlappingOccurrences(entry.occurrences) }))
    .filter((entry) => entry.occurrences.length >= 2)
    .sort((a, b) => b.occurrences.length - a.occurrences.length || b.representative.length - a.representative.length || a.occurrences[0].startTick - b.occurrences[0].startTick)
    .slice(0, maxMotifs)
    .map((entry, index) => Object.freeze({
      id: `motif-${index + 1}`,
      noteLength,
      signature: entry.signature,
      occurrenceCount: entry.occurrences.length,
      occurrences: Object.freeze(entry.occurrences),
      representativePitches: Object.freeze(entry.representative.map((note) => note.pitch)),
    }));

  return Object.freeze({
    trackId,
    motifs: Object.freeze(motifs),
    note: motifs.length
      ? '音程差とリズム間隔が一致する反復を、移調に依存しないMotif候補として表示しています。'
      : '指定長で2回以上反復するMotif候補は見つかりませんでした。',
    parameters: Object.freeze({ noteLength, maxMotifs }),
  });
}
