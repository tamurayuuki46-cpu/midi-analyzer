import { inferRoleHint } from './roleHint.js';

const VALID_ORIGINS = new Set(['midi', 'ripx', 'separator']);
const DEFAULT_TEMPO_US_PER_BEAT = 500000;
const DEFAULT_TIME_SIGNATURE = Object.freeze({ numerator: 4, denominator: 4 });

export class UnsupportedMidiTimingError extends Error {
  constructor(message = 'SMPTE方式のMIDI時間分割はv0.1では未対応です。') {
    super(message);
    this.name = 'UnsupportedMidiTimingError';
  }
}

export class InvalidMidiDataError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidMidiDataError';
  }
}

function normalizeOrigin(origin) {
  if (!VALID_ORIGINS.has(origin)) {
    throw new InvalidMidiDataError(`未対応のoriginです: ${origin}`);
  }
  return origin;
}

function getPpq(header = {}) {
  if (Number.isInteger(header.ticksPerBeat) && header.ticksPerBeat > 0) {
    return header.ticksPerBeat;
  }

  if (header.framesPerSecond || header.ticksPerFrame) {
    throw new UnsupportedMidiTimingError();
  }

  throw new InvalidMidiDataError('MIDIヘッダーに有効なticksPerBeatがありません。');
}

function toBpm(microsecondsPerBeat) {
  return 60000000 / microsecondsPerBeat;
}

function collapseByTick(entries) {
  const byTick = new Map();
  for (const entry of entries.sort((a, b) => a.tick - b.tick || a.order - b.order)) {
    byTick.set(entry.tick, entry);
  }
  return [...byTick.values()].sort((a, b) => a.tick - b.tick);
}

function finalizeTempoMap(entries) {
  const collapsed = collapseByTick(entries).map(({ order: _order, ...entry }) => entry);
  if (collapsed.length === 0 || collapsed[0].tick > 0) {
    collapsed.unshift({
      tick: 0,
      microsecondsPerBeat: DEFAULT_TEMPO_US_PER_BEAT,
      bpm: 120,
      implicit: true,
    });
  }
  return collapsed;
}

function finalizeTimeSignatures(entries) {
  const collapsed = collapseByTick(entries).map(({ order: _order, ...entry }) => entry);
  if (collapsed.length === 0 || collapsed[0].tick > 0) {
    collapsed.unshift({
      tick: 0,
      ...DEFAULT_TIME_SIGNATURE,
      implicit: true,
    });
  }
  return collapsed;
}

function makePendingKey(channel, pitch) {
  return `${channel}:${pitch}`;
}

function isNoteOff(event) {
  return event.type === 'noteOff' || (event.type === 'noteOn' && event.velocity === 0);
}

function isNoteOn(event) {
  return event.type === 'noteOn' && event.velocity > 0;
}

export function normalizeMidi(parsedMidi, options = {}) {
  if (!parsedMidi || !parsedMidi.header || !Array.isArray(parsedMidi.tracks)) {
    throw new InvalidMidiDataError('MIDIデータにheaderまたはtracksがありません。');
  }

  const origin = normalizeOrigin(options.origin ?? 'midi');
  const fileName = options.fileName || 'untitled.mid';
  const ppq = getPpq(parsedMidi.header);

  const notes = [];
  const tracks = [];
  const tempoEntries = [];
  const signatureEntries = [];
  const warnings = [];
  let eventOrder = 0;
  let lengthTicks = 0;

  parsedMidi.tracks.forEach((events, trackIndex) => {
    const trackId = `track-${trackIndex + 1}`;
    let absoluteTick = 0;
    let trackName = '';
    let trackNoteCounter = 0;
    const channels = new Set();
    const pendingNotes = new Map();
    const trackNotes = [];

    for (const event of events) {
      absoluteTick += Number.isFinite(event.deltaTime) ? event.deltaTime : 0;
      lengthTicks = Math.max(lengthTicks, absoluteTick);
      eventOrder += 1;

      if (typeof event.channel === 'number') channels.add(event.channel);
      if (event.type === 'trackName' && typeof event.text === 'string' && !trackName) {
        trackName = event.text.trim();
      }

      if (event.type === 'setTempo' && Number.isFinite(event.microsecondsPerBeat) && event.microsecondsPerBeat > 0) {
        tempoEntries.push({
          tick: absoluteTick,
          microsecondsPerBeat: event.microsecondsPerBeat,
          bpm: toBpm(event.microsecondsPerBeat),
          order: eventOrder,
        });
      }

      if (event.type === 'timeSignature' && Number.isInteger(event.numerator) && Number.isInteger(event.denominator)) {
        signatureEntries.push({
          tick: absoluteTick,
          numerator: event.numerator,
          denominator: event.denominator,
          order: eventOrder,
        });
      }

      if (isNoteOn(event)) {
        const key = makePendingKey(event.channel, event.noteNumber);
        const queue = pendingNotes.get(key) ?? [];
        queue.push({
          startTick: absoluteTick,
          velocity: event.velocity,
          channel: event.channel,
          pitch: event.noteNumber,
        });
        pendingNotes.set(key, queue);
        continue;
      }

      if (isNoteOff(event)) {
        const key = makePendingKey(event.channel, event.noteNumber);
        const queue = pendingNotes.get(key);
        if (!queue || queue.length === 0) {
          warnings.push({
            code: 'UNMATCHED_NOTE_OFF',
            trackId,
            tick: absoluteTick,
            channel: event.channel,
            pitch: event.noteNumber,
          });
          continue;
        }

        const noteOn = queue.shift();
        if (queue.length === 0) pendingNotes.delete(key);

        trackNoteCounter += 1;
        const durationTick = Math.max(0, absoluteTick - noteOn.startTick);
        const note = Object.freeze({
          id: `${trackId}-note-${trackNoteCounter}`,
          pitch: noteOn.pitch,
          startTick: noteOn.startTick,
          durationTick,
          velocity: noteOn.velocity,
          trackId,
          channel: noteOn.channel,
          origin,
        });
        trackNotes.push(note);
        notes.push(note);
        lengthTicks = Math.max(lengthTicks, note.startTick + note.durationTick);
      }
    }

    for (const queue of pendingNotes.values()) {
      for (const dangling of queue) {
        warnings.push({
          code: 'UNMATCHED_NOTE_ON',
          trackId,
          tick: dangling.startTick,
          channel: dangling.channel,
          pitch: dangling.pitch,
        });
      }
    }

    const channelList = [...channels].sort((a, b) => a - b);
    const isDrums = trackNotes.length > 0 && channelList.length === 1 && channelList[0] === 9;
    const displayName = trackName || `Track ${trackIndex + 1}`;

    tracks.push(Object.freeze({
      id: trackId,
      name: displayName,
      channels: Object.freeze(channelList),
      noteCount: trackNotes.length,
      isDrums,
      roleHint: inferRoleHint(displayName, channelList),
    }));
  });

  notes.sort((a, b) => a.startTick - b.startTick || a.trackId.localeCompare(b.trackId) || a.pitch - b.pitch);

  const song = Object.freeze({
    schemaVersion: '0.1',
    source: Object.freeze({ fileName, origin }),
    ppq,
    tempoMap: Object.freeze(finalizeTempoMap(tempoEntries).map(Object.freeze)),
    timeSignatures: Object.freeze(finalizeTimeSignatures(signatureEntries).map(Object.freeze)),
    lengthTicks,
    tracks: Object.freeze(tracks),
    notes: Object.freeze(notes),
  });

  return Object.freeze({ song, warnings: Object.freeze(warnings) });
}
