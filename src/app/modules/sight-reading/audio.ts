import { pianoAudio } from "../../shared/audio/AudioEngine";

/**
 * Play a single note by its ID (e.g. "C4", "Eb3").
 * Uses real piano samples when available for a natural sound.
 */
export function playNoteSound(noteId: string): void {
  pianoAudio.play(noteId);
}

/**
 * Play a chord — all note IDs sound simultaneously.
 */
export function playChordSound(noteIds: string[]): void {
  pianoAudio.playChord(noteIds);
}

/**
 * Play a celebratory upward arpeggio of the given notes.
 */
export function playSuccessArpeggio(noteIds: string[]): void {
  pianoAudio.playArpeggio(noteIds, 120);
}

/**
 * Play a success feedback sound — pleasant chord.
 */
export function playSuccessSound(): void {
  pianoAudio.playSuccess();
}

/**
 * Play an error feedback sound — descending tones.
 */
export function playErrorSound(): void {
  pianoAudio.playError();
}

/**
 * Returns true once the audio engine is initialized.
 */
export function isAudioReady(): boolean {
  return pianoAudio.isReady();
}

/**
 * Initialize the shared audio engine. Safe to call multiple times.
 */
export async function initAudio(): Promise<void> {
  await pianoAudio.init();
}
