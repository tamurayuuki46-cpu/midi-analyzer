import { parseMidi } from 'midi-file';
import { InvalidMidiDataError, normalizeMidi } from './normalizeMidi.js';

const MIDI_EXTENSIONS = ['.mid', '.midi'];

function hasMidiExtension(name = '') {
  const lowerName = name.toLowerCase();
  return MIDI_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

export async function importMidiFile(file, options = {}) {
  if (!file || typeof file.arrayBuffer !== 'function') {
    throw new TypeError('File.arrayBuffer()を利用できるMIDIファイルが必要です。');
  }

  if (!hasMidiExtension(file.name || '')) {
    throw new InvalidMidiDataError('.mid または .midi ファイルを選んでください。');
  }

  if (file.size === 0) {
    throw new InvalidMidiDataError('MIDIファイルが空です。');
  }

  let parsedMidi;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    parsedMidi = parseMidi(bytes);
  } catch (error) {
    throw new InvalidMidiDataError(`MIDIファイルを読み込めませんでした: ${error.message}`);
  }

  return normalizeMidi(parsedMidi, {
    fileName: file.name,
    origin: options.origin ?? 'midi',
  });
}
