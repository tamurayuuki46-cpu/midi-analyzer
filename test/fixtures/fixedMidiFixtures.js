export const FORMAT_1_TEMPO_FIXTURE_HEX = '4d546864000000060001000201e04d54726b0000002400ff030554656d706f00ff510307a12000ff5804040218088360ff5103061a8000ff2f004d54726b0000001f00ff03055069616e6f00903c648360803c4000904064817090400000ff2f00';

export const FORMAT_0_DRUM_FIXTURE_HEX = '4d546864000000060000000101e04d54726b0000001e00ff03054472756d7300ff5804030218080099246e817099240000ff2f00';

export function hexToUint8Array(hex) {
  if (hex.length % 2 !== 0) throw new Error('Invalid fixture hex length');
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

export function makeMidiFixtureFile(name, hex) {
  const bytes = hexToUint8Array(hex);
  return {
    name,
    size: bytes.byteLength,
    async arrayBuffer() {
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    },
  };
}
