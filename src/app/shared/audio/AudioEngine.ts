import * as Tone from "tone";
import { Piano } from "d-piano";

/**
 * Dual audio engine:
 * - Real piano samples (d-piano) for question notes (natural, warm)
 * - Soft synthesizer (Tone.js) for success/error feedback (quick, responsive)
 */
export class PianoAudio {
  private piano: Piano | null = null;
  private feedbackSynth: Tone.Synth | null = null;
  private reverb: Tone.Freeverb | null = null;
  private gainNode: Tone.Gain | null = null;
  private started = false;
  private _initPromise: Promise<void> | null = null;
  private pianoReady = false;

  isReady(): boolean {
    return this.started;
  }

  isPianoReady(): boolean {
    return this.pianoReady;
  }

  async init(): Promise<void> {
    if (this._initPromise) return this._initPromise;
    if (this.started) return;

    this._initPromise = (async () => {
      try {
        await Tone.start();
        console.log("PianoAudio: Tone.start() called");

        this.gainNode = new Tone.Gain(0.8).toDestination();

        this.reverb = new Tone.Freeverb({
          roomSize: 0.2,
          dampening: 3000,
        }).connect(this.gainNode);

        this.feedbackSynth = new Tone.Synth({
          oscillator: { type: "sine" },
          envelope: {
            attack: 0.01,
            decay: 0.2,
            sustain: 0.0,
            release: 0.3,
          },
        }).connect(this.reverb);

        try {
          this.piano = new Piano({
            velocities: 1,
            notes: [
              "C3","C#3","D3","D#3","E3","F3","F#3","G3","G#3","A3","A#3","B3",
              "C4","C#4","D4","D#4","E4","F4","F#4","G4","G#4","A4","A#4","B4",
              "C5","C#5","D5","D#5","E5","F5","F#5","G5","G#5","A5","A#5","B5",
              "C6",
            ],
            baseUrl: "https://cdn.jsdelivr.net/npm/d-piano@1.2.0/samples/",
          });
          await this.piano.loaded;
          this.pianoReady = true;
          console.log("PianoAudio: d-piano samples loaded successfully");
        } catch (pianoErr) {
          console.warn("PianoAudio: d-piano failed, falling back to synth", pianoErr);
          this.pianoReady = false;
        }

        this.started = true;
        console.log("PianoAudio: initialized successfully");
      } catch (e) {
        console.warn("PianoAudio: init failed", e);
      }
    })();

    return this._initPromise;
  }

  play(note: string): void {
    if (!this.started) {
      console.warn("PianoAudio.play: not ready");
      return;
    }
    try {
      if (this.piano && this.pianoReady) {
        this.piano.play(note, 1.0, 0);
      } else if (this.feedbackSynth) {
        this.feedbackSynth.triggerAttackRelease(note, "2n");
      }
    } catch (e) {
      console.warn("PianoAudio.play failed", note, e);
    }
  }

  playSuccess(note: string = "C5"): void {
    if (!this.feedbackSynth || !this.started) return;
    try {
      const now = Tone.now();
      this.feedbackSynth.triggerAttackRelease("C5", "8n", now);
      this.feedbackSynth.triggerAttackRelease("E5", "8n", now + 0.08);
      this.feedbackSynth.triggerAttackRelease("G5", "4n", now + 0.16);
    } catch (e) {
      console.warn("PianoAudio.playSuccess failed", e);
    }
  }

  playError(note: string = "F4"): void {
    if (!this.feedbackSynth || !this.started) return;
    try {
      const now = Tone.now();
      this.feedbackSynth.triggerAttackRelease("F4", "8n", now);
      this.feedbackSynth.triggerAttackRelease("E4", "4n", now + 0.1);
    } catch (e) {
      console.warn("PianoAudio.playError failed", e);
    }
  }

  playChord(notes: string[]): void {
    if (!this.started || !notes || notes.length === 0) return;
    try {
      if (this.piano && this.pianoReady) {
        notes.forEach((note) => this.piano!.play(note, 1.0, 0));
      } else if (this.feedbackSynth) {
        this.feedbackSynth.triggerAttackRelease(notes, "2n");
      }
    } catch (e) {
      console.warn("PianoAudio.playChord failed", notes, e);
    }
  }

  playArpeggio(notes: string[], intervalMs = 120): void {
    if (!this.started || !notes || notes.length === 0) return;
    try {
      const now = Tone.now();
      notes.forEach((note, i) => {
        const time = now + (i * intervalMs) / 1000;
        if (this.piano && this.pianoReady) {
          setTimeout(() => this.piano?.play(note, 1.0, 0), i * intervalMs);
        } else if (this.feedbackSynth) {
          this.feedbackSynth.triggerAttackRelease(note, "8n", time);
        }
      });
    } catch (e) {
      console.warn("PianoAudio.playArpeggio failed", notes, e);
    }
  }

  setVolume(v: number): void {
    if (!this.gainNode) return;
    const clamped = Math.max(0, Math.min(1, v));
    this.gainNode.gain.value = clamped;
  }
}

export const pianoAudio = new PianoAudio();
