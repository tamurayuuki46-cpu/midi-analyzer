import { parseMidi } from 'midi-file';
import { InvalidMidiDataError, normalizeMidi } from './normalizeMidi.js';

const MIDI_EXTENSIONS = ['.mid', '.midi'];

function hasMidiExtension(name = '') {
  const lowerName = name.toLowerCase();
  return MIDI_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

export async function importMidiFile(file, options = {}) {
  if (!file || typeof file.arrayBuffer !== 'function') {
    throw new TypeError('A File-like object with arrayBuffer() is required.');
  }

  if (!hasMidiExtension(file.name || '')) {
    throw new InvalidMidiDataError('Please choose a .mid or .midi file.');
  }

  if (file.size === 0) {
    throw new InvalidMidiDataError('The MIDI file is empty.');
  }

  let parsedMidi;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    parsedMidi = parseMidi(bytes);
  } catch (error) {
    throw new InvalidMidiDataError(`Could not read this MIDI file: ${error.message}`);
  }

  return normalizeMidi(parsedMidi, {
    fileName: file.name,
    origin: options.origin ?? 'midi',
  });
}
