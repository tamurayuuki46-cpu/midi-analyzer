export const RECORDER_PART_TYPES = Object.freeze(['melody', 'chord', 'bass', 'drum']);

function trackNotes(song, trackId) {
  return (song.notes ?? [])
    .filter((note) => note.trackId === trackId)
    .sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
}

function averagePitch(song, trackId) {
  const notes = trackNotes(song, trackId);
  if (!notes.length) return null;
  return notes.reduce((sum, note) => sum + note.pitch, 0) / notes.length;
}

function nonDrumTracksWithNotes(song) {
  return (song.tracks ?? []).filter((track) => !track.isDrums && trackNotes(song, track.id).length > 0);
}

function explicitTracks(song, roleHint) {
  return (song.tracks ?? []).filter((track) => track.roleHint === roleHint && trackNotes(song, track.id).length > 0);
}

export function inferPartTrackIds(song, partType) {
  if (!RECORDER_PART_TYPES.includes(partType)) return [];

  if (partType === 'drum') {
    return (song.tracks ?? [])
      .filter((track) => track.isDrums || trackNotes(song, track.id).some((note) => note.channel === 9))
      .filter((track) => trackNotes(song, track.id).length > 0)
      .map((track) => track.id);
  }

  const explicit = explicitTracks(song, partType);
  if (explicit.length) return explicit.map((track) => track.id);

  const candidates = nonDrumTracksWithNotes(song);
  if (!candidates.length) return [];

  if (partType === 'melody') {
    return [candidates
      .map((track) => ({ id: track.id, avg: averagePitch(song, track.id) ?? -Infinity }))
      .sort((a, b) => b.avg - a.avg)[0].id];
  }

  if (partType === 'bass') {
    return [candidates
      .map((track) => ({ id: track.id, avg: averagePitch(song, track.id) ?? Infinity }))
      .sort((a, b) => a.avg - b.avg)[0].id];
  }

  const melodyIds = new Set(inferPartTrackIds(song, 'melody'));
  const bassIds = new Set(inferPartTrackIds(song, 'bass'));
  const middle = candidates.filter((track) => !melodyIds.has(track.id) && !bassIds.has(track.id));
  return (middle.length ? middle : candidates).map((track) => track.id);
}

export function buildPartSong(song, trackIds) {
  const selected = new Set((trackIds ?? []).filter(Boolean));
  const tracks = (song.tracks ?? []).filter((track) => selected.has(track.id));
  const notes = (song.notes ?? []).filter((note) => selected.has(note.trackId));

  if (!tracks.length || !notes.length) {
    throw new Error('録音対象のTrackにNoteがありません。');
  }

  return Object.freeze({
    ...song,
    source: { ...song.source },
    tempoMap: [...(song.tempoMap ?? [])],
    timeSignatures: [...(song.timeSignatures ?? [])],
    tracks: tracks.map((track) => ({ ...track, channels: [...(track.channels ?? [])] })),
    notes: notes.map((note) => ({ ...note })),
  });
}

function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return `take-${globalThis.crypto.randomUUID()}`;
  }
  return `take-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function buildTakeRecord(song, input = {}) {
  const blob = input.blob;
  if (!blob || typeof blob.arrayBuffer !== 'function') {
    throw new TypeError('録音Audio Blobが必要です。');
  }
  if (!RECORDER_PART_TYPES.includes(input.partType)) {
    throw new TypeError('partTypeはmelody / chord / bass / drumのいずれかです。');
  }

  const trackIds = [...new Set((input.trackIds ?? []).filter(Boolean))];
  const audioBytes = await blob.arrayBuffer();
  const fallbackName = `${input.partType} Take`;

  return Object.freeze({
    takeSchemaVersion: 1,
    id: input.id ?? createId(),
    savedAt: input.savedAt ?? new Date().toISOString(),
    name: String(input.name || fallbackName).trim().slice(0, 80) || fallbackName,
    partType: input.partType,
    trackIds,
    source: {
      fileName: song.source?.fileName ?? 'untitled.mid',
      origin: song.source?.origin ?? 'midi',
    },
    mimeType: input.mimeType || blob.type || 'audio/webm',
    durationSeconds: Math.max(0, Number(input.durationSeconds) || 0),
    eventCount: Math.max(0, Number(input.eventCount) || 0),
    audioBytes,
  });
}

export function audioExtensionForMimeType(mimeType = '') {
  const normalized = mimeType.toLowerCase();
  if (normalized.includes('mp4') || normalized.includes('m4a')) return 'm4a';
  if (normalized.includes('ogg')) return 'ogg';
  if (normalized.includes('wav')) return 'wav';
  return 'webm';
}
