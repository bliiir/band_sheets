/**
 * ChordService.js
 * Service for handling chord transposition and related operations
 */

/**
 * Transpose a chord by a given number of semitones
 * @param {string} chord - The chord to transpose (e.g., "C", "Dm7", "G#maj7")
 * @param {number} semitones - Number of semitones to transpose (positive or negative)
 * @returns {string} The transposed chord
 */
export const transposeChord = (chord, semitones) => {
  if (!chord || semitones === 0) return chord;
  
  // Define the notes in order (including sharps/flats)
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flatNotes = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  
  // Regular expression to find chord root notes
  // Matches C, C#, Db, etc. at the start of a chord or after a space or slash
  return chord.replace(/(?:^|\s|\/)([A-G][b#]?)/g, (match, rootNote) => {
    const useFlats = rootNote.includes('b');
    const noteArray = useFlats ? flatNotes : notes;
    
    // Clean the root note (remove any non-letter characters)
    const cleanRoot = rootNote.charAt(0);
    const accidental = rootNote.substring(1);
    
    // Find the current note index
    let noteIndex;
    if (accidental === '#') {
      noteIndex = notes.indexOf(rootNote);
    } else if (accidental === 'b') {
      noteIndex = flatNotes.indexOf(rootNote);
    } else {
      noteIndex = notes.indexOf(cleanRoot);
    }
    
    if (noteIndex === -1) return match; // If not found, return original
    
    // Calculate new index with modulo to wrap around
    const newIndex = (noteIndex + semitones + 12) % 12;
    
    // Replace the root note but keep the rest of the match
    return match.replace(rootNote, noteArray[newIndex]);
  });
};

/**
 * Generate chord display based on transpose value for a chord progression
 * @param {string} chords - Chord progression string (e.g., "C G Am F")
 * @param {number} semitones - Number of semitones to transpose
 * @returns {string} The transposed chord progression
 */
export const getTransposedChords = (chords, semitones) => {
  if (!chords) return '';
  
  // Split by spaces or other common chord progression separators
  const chordArray = chords.split(/([|\s-])/);
  return chordArray.map(item => {
    // Only transpose items that look like chords
    if (/^[A-G][b#]?/.test(item)) {
      return transposeChord(item, semitones);
    }
    return item;
  }).join('');
};
