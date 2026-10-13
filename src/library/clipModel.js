import {
  getDefaultBassTrackId,
  getDefaultMelodyTrackId,
  getDefaultRhythmTrackIds,
} from '../analysis/basic/index.js';
import {
  analyzeChords,
  buildAnalysisWindows,
  getDefaultChordTrackIds,
} from '../analysis/chord/index.js';
import { analyzeKeyScale } from '../analysis/key/index.js';
import { analyzeMotifs } from '../analysis/motif/index.js';

export const CLIP_TYPES = Object.freeze(['chord', 'melody', 'bass', 'drum', 'motif']);
export const MATERIAL_SOURCE_TYPES = Object.freeze([
  'self',
  'reference',
  'moises-stem',
  'audio-to-midi',
  'ripx',
  'book',
  'plugin',
  'manual',
  'other',
  'unknown',
]);

function createClipId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return `clip-${globalThis.crypto.randomUUID()}`;
  }
  return `clip-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function barRanges(song) {
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

export function buildFourBarRanges(song) {
  const bars = barRanges(song);
  if (!bars.length) return Object.freeze([]);
  const result = [];
  if (bars.length < 4) {
    result.push(Object.freeze({
      startBar: bars[0].barNumber,
      endBar: bars.at(-1).barNumber,
      startTick: bars[0].startTick,
      endTick: bars.at(-1).endTick,
      barCount: bars.length,
      complete: false,
    }));
    return Object.freeze(result);
  }

  for (let index = 0; index <= bars.length - 4; index += 1) {
    const chunk = bars.slice(index, index + 4);
    result.push(Object.freeze({
      startBar: chunk[0].barNumber,
      endBar: chunk.at(-1).barNumber,
      startTick: chunk[0].startTick,
      endTick: chunk.at(-1).endTick,
      barCount: 4,
      complete: true,
    }));
  }
  return Object.freeze(result);
}

function activeMetaEvent(events, tick, fallback) {
  const sorted = [...(events ?? [])]
    .filter((entry) => Number.isFinite(entry.tick) && entry.tick <= tick)
    .sort((a, b) => a.tick - b.tick);
  return sorted.at(-1) ?? fallback;
}

function shiftedEvents(events, startTick, endTick, active) {
  const result = [{ ...active, tick: 0 }];
  for (const event of events ?? []) {
    if (event.tick > startTick && event.tick < endTick) {
      result.push({ ...event, tick: event.tick - startTick });
    }
  }
  return result;
}

function clippedNotes(song, range, trackIds = null) {
  const selected = trackIds ? new Set(trackIds.filter(Boolean)) : null;
  return (song?.notes ?? [])
    .filter((note) => (!selected || selected.has(note.trackId)))
    .filter((note) => note.durationTick > 0 && note.startTick < range.endTick && note.startTick + note.durationTick > range.startTick)
    .map((note) => {
      const overlapStart = Math.max(note.startTick, range.startTick);
      const overlapEnd = Math.min(note.startTick + note.durationTick, range.endTick);
      return Object.freeze({
        ...note,
        id: `${note.id}-clip-${range.startBar}`,
        startTick: overlapStart - range.startTick,
        durationTick: Math.max(0, overlapEnd - overlapStart),
      });
    });
}

function clippedSong(song, range) {
  const tempo = activeMetaEvent(song?.tempoMap, range.startTick, {
    tick: 0,
    microsecondsPerBeat: 500000,
    bpm: 120,
    implicit: true,
  });
  const meter = activeMetaEvent(song?.timeSignatures, range.startTick, {
    tick: 0,
    numerator: 4,
    denominator: 4,
    implicit: true,
  });
  return {
    ...song,
    source: { ...(song?.source ?? {}) },
    lengthTicks: range.endTick - range.startTick,
    notes: clippedNotes(song, range),
    tempoMap: shiftedEvents(song?.tempoMap, range.startTick, range.endTick, tempo),
    timeSignatures: shiftedEvents(song?.timeSignatures, range.startTick, range.endTick, meter),
  };
}

function trackIdsForType(song, type) {
  if (type === 'chord') return getDefaultChordTrackIds(song);
  if (type === 'melody' || type === 'motif') return [getDefaultMelodyTrackId(song)].filter(Boolean);
  if (type === 'bass') return [getDefaultBassTrackId(song)].filter(Boolean);
  if (type === 'drum') {
    const drums = (song?.tracks ?? []).filter((track) => track.isDrums || track.roleHint === 'drums').map((track) => track.id);
    return drums.length ? drums : getDefaultRhythmTrackIds(song);
  }
  return [];
}

function normalizeCustomTags(value) {
  const raw = Array.isArray(value) ? value : String(value ?? '').split(',');
  return Object.freeze([...new Set(raw.map((item) => String(item).trim()).filter(Boolean))].slice(0, 20));
}

function normalizeProjectIds(value) {
  const raw = Array.isArray(value) ? value : String(value ?? '').split(',');
  return Object.freeze([...new Set(raw.map((item) => String(item).trim()).filter(Boolean))].slice(0, 20));
}

function inferredSourceType(song) {
  const origin = String(song?.source?.origin ?? '').toLowerCase();
  if (origin.includes('moises')) return 'moises-stem';
  if (origin.includes('basic') || origin.includes('audio')) return 'audio-to-midi';
  if (origin.includes('ripx')) return 'ripx';
  return 'unknown';
}

function provenanceForClip(song, options, savedAt) {
  const supplied = options.provenance ?? {};
  const sourceType = MATERIAL_SOURCE_TYPES.includes(supplied.type) ? supplied.type : inferredSourceType(song);
  return Object.freeze({
    type: sourceType,
    sourceTitle: String(supplied.sourceTitle ?? '').trim(),
    sourceProjectId: String(supplied.sourceProjectId ?? '').trim() || null,
    usedInProjectIds: normalizeProjectIds(supplied.usedInProjectIds),
    importedFrom: String(song?.source?.origin ?? 'midi'),
    createdBy: 'midi-analyzer',
    recordedAt: supplied.recordedAt ?? savedAt,
  });
}

function defaultName(song, type, range) {
  const source = song?.source?.fileName?.replace(/\.(mid|midi)$/i, '') || 'MIDI';
  return `${source} · ${type} · ${range.startBar}-${range.endBar}小節`;
}

function keyForClip(clipSong) {
  return analyzeKeyScale(clipSong).candidates[0]?.value ?? '';
}

function bpmForRange(song, range) {
  const tempo = activeMetaEvent(song?.tempoMap, range.startTick, { bpm: 120 });
  return Number.isFinite(tempo?.bpm) ? Number(tempo.bpm.toFixed(1)) : null;
}

function progressionForClip(clipSong) {
  const result = analyzeChords(clipSong, { trackIds: getDefaultChordTrackIds(clipSong) });
  return Object.freeze(result.segments.map((segment) => Object.freeze({
    barNumber: segment.barNumber,
    startTick: segment.startTick,
    endTick: segment.endTick,
    value: segment.candidates[0]?.value ?? null,
    confidence: segment.candidates[0]?.confidence ?? 0,
  })).filter((item) => item.value));
}

export function buildClipRecord(song, options = {}) {
  const type = options.type ?? 'melody';
  if (!CLIP_TYPES.includes(type)) throw new TypeError(`未対応のClip typeです: ${type}`);
  const ranges = buildFourBarRanges(song);
  const range = ranges.find((item) => item.startBar === Number(options.startBar)) ?? ranges[0];
  if (!range) throw new Error('Clipに切り出せる小節がありません。');

  const clipSong = clippedSong(song, range);
  const trackIds = trackIdsForType(song, type);
  const notes = clippedNotes(song, range, trackIds);
  const autoKey = keyForClip(clipSong);
  const autoBpm = bpmForRange(song, range);
  const customKey = String(options.tags?.key ?? '').trim();
  const customBpm = Number(options.tags?.bpm);
  const motifs = type === 'motif' ? analyzeMotifs(clipSong).motifs.slice(0, 5) : [];
  const savedAt = options.savedAt ?? new Date().toISOString();

  return Object.freeze({
    clipSchemaVersion: 2,
    id: options.id ?? createClipId(),
    savedAt,
    type,
    name: String(options.name ?? '').trim() || defaultName(song, type, range),
    source: Object.freeze({
      fileName: song?.source?.fileName ?? 'untitled.mid',
      origin: song?.source?.origin ?? 'midi',
    }),
    provenance: provenanceForClip(song, options, savedAt),
    range: Object.freeze({ ...range, lengthTicks: range.endTick - range.startTick }),
    ppq: song?.ppq ?? null,
    trackIds: Object.freeze([...trackIds]),
    notes: Object.freeze(notes),
    chordProgression: progressionForClip(clipSong),
    motifs: Object.freeze(motifs),
    tags: Object.freeze({
      genre: String(options.tags?.genre ?? '').trim(),
      mood: String(options.tags?.mood ?? '').trim(),
      bpm: Number.isFinite(customBpm) && customBpm > 0 ? customBpm : autoBpm,
      key: customKey || autoKey,
      custom: normalizeCustomTags(options.tags?.custom),
    }),
  });
}

function searchableText(record) {
  return [
    record?.name,
    record?.type,
    record?.source?.fileName,
    record?.provenance?.type,
    record?.provenance?.sourceTitle,
    record?.provenance?.sourceProjectId,
    ...(record?.provenance?.usedInProjectIds ?? []),
    record?.tags?.genre,
    record?.tags?.mood,
    record?.tags?.key,
    record?.tags?.bpm,
    ...(record?.tags?.custom ?? []),
    ...(record?.chordProgression ?? []).map((item) => item.value),
  ].filter((item) => item !== null && item !== undefined).join(' ').toLocaleLowerCase('ja-JP');
}

export function filterClipRecords(records, query) {
  const tokens = String(query ?? '').trim().toLocaleLowerCase('ja-JP').split(/\s+/).filter(Boolean);
  if (!tokens.length) return Object.freeze([...(records ?? [])]);
  return Object.freeze((records ?? []).filter((record) => {
    const text = searchableText(record);
    return tokens.every((token) => text.includes(token));
  }));
}
