import { pianoAudio } from "../../shared/audio/AudioEngine";

/**
 * Play a single note by its ID (e.g. "C4", "Eb3").
 * Thin wrapper over the shared PianoAudio engine.
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
