function ascii(text) {
  return [...text].map((char) => char.charCodeAt(0));
}

function u32(value) {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

function encodeVlq(value) {
  let buffer = Math.max(0, Math.floor(value)) & 0x7f;
  const out = [];
  let remaining = Math.max(0, Math.floor(value)) >> 7;
  while (remaining) {
    buffer <<= 8;
    buffer |= (remaining & 0x7f) | 0x80;
    remaining >>= 7;
  }
  while (true) {
    out.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return out;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function textMeta(type, text) {
  const bytes = [...new TextEncoder().encode(String(text))];
  return [0xff, type, ...encodeVlq(bytes.length), ...bytes];
}

export function noteEventsToMidi(noteEvents, { bpm = 120, ppq = 480, trackName = 'Basic Pitch' } = {}) {
  const safeBpm = clamp(Number(bpm) || 120, 20, 300);
  const safePpq = clamp(Math.round(Number(ppq) || 480), 24, 0x7fff);
  const ticksPerSecond = (safePpq * safeBpm) / 60;
  const micros = Math.round(60000000 / safeBpm);
  const events = [
    { tick: 0, order: -3, bytes: [0xff, 0x51, 0x03, (micros >> 16) & 0xff, (micros >> 8) & 0xff, micros & 0xff] },
    { tick: 0, order: -2, bytes: [0xff, 0x58, 0x04, 4, 2, 24, 8] },
    { tick: 0, order: -1, bytes: textMeta(0x03, trackName) },
  ];

  for (const note of noteEvents || []) {
    const pitch = clamp(Math.round(Number(note.pitchMidi) || 0), 0, 127);
    const startSeconds = Math.max(0, Number(note.startTimeSeconds) || 0);
    const durationSeconds = Math.max(0.01, Number(note.durationSeconds) || 0.01);
    const startTick = Math.max(0, Math.round(startSeconds * ticksPerSecond));
    const endTick = Math.max(startTick + 1, Math.round((startSeconds + durationSeconds) * ticksPerSecond));
    const velocity = clamp(Math.round((Number(note.amplitude) || 0.75) * 127), 1, 127);
    events.push({ tick: startTick, order: 1, bytes: [0x90, pitch, velocity] });
    events.push({ tick: endTick, order: 0, bytes: [0x80, pitch, 0] });
  }

  events.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const body = [];
  let lastTick = 0;
  for (const event of events) {
    body.push(...encodeVlq(Math.max(0, event.tick - lastTick)), ...event.bytes);
    lastTick = event.tick;
  }
  body.push(0x00, 0xff, 0x2f, 0x00);

  return new Uint8Array([
    ...ascii('MThd'), 0, 0, 0, 6,
    0, 0,
    0, 1,
    (safePpq >> 8) & 0xff, safePpq & 0xff,
    ...ascii('MTrk'), ...u32(body.length), ...body,
  ]);
}
