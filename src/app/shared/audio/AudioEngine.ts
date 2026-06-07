import * as Tone from "tone";

/**
 * PianoAudio — improved synthesizer-based piano with layered oscillators.
 *
 * Uses Tone.js PolySynth with multiple oscillators to create a warmer,
 * more piano-like sound without needing external sample files.
 */
export class PianoAudio {
  private polySynth: Tone.PolySynth | null = null;
  private started = false;
  private _initPromise: Promise<void> | null = null;

  isReady(): boolean {
    return this.started && this.polySynth !== null;
  }

  async init(): Promise<void> {
    if (this._initPromise) return this._initPromise;
    if (this.started) return;

    this._initPromise = (async () => {
      try {
        await Tone.start();
        console.log("PianoAudio: Tone.start() called");

        // Create a richer piano-like sound with multiple oscillators
        this.polySynth = new Tone.PolySynth(Tone.Synth, {
          oscillator: {
            type: "triangle8",
            detune: 0,
          },
          envelope: {
            attack: 0.02,
            decay: 0.15,
            sustain: 0.4,
            release: 1.5,
          },
          filter: {
            type: "lowpass",
            frequency: 4000,
            Q: 1,
          },
        }).toDestination();

        // Add effects for warmth
        const reverb = new Tone.Freeverb({
          roomSize: 0.3,
          dampening: 4000,
        }).toDestination();
        this.polySynth.connect(reverb);

        this.started = true;
        console.log("PianoAudio: initialized successfully");
      } catch (e) {
        console.warn("PianoAudio: init failed", e);
      }
    })();

    return this._initPromise;
  }

  play(note: string): void {
    if (!this.polySynth || !this.started) {
      console.warn("PianoAudio.play: not ready", { started: this.started, polySynth: !!this.polySynth });
      return;
    }
    try {
      console.log("PianoAudio.play:", note);
      this.polySynth.triggerAttackRelease(note, "4n");
    } catch (e) {
      console.warn("PianoAudio.play failed", note, e);
    }
  }

  playChord(notes: string[]): void {
    if (!this.polySynth || !this.started) return;
    if (!notes || notes.length === 0) return;
    try {
      this.polySynth.triggerAttackRelease(notes, "4n");
    } catch (e) {
      console.warn("PianoAudio.playChord failed", notes, e);
    }
  }

  playArpeggio(notes: string[], intervalMs = 120): void {
    if (!this.polySynth || !this.started) return;
    if (!notes || notes.length === 0) return;
    try {
      const now = Tone.now();
      notes.forEach((note, i) => {
        this.polySynth!.triggerAttackRelease(
          note,
          "8n",
          now + (i * intervalMs) / 1000
        );
      });
    } catch (e) {
      console.warn("PianoAudio.playArpeggio failed", notes, e);
    }
  }

  setVolume(v: number): void {
    if (!this.polySynth) return;
    const clamped = Math.max(0, Math.min(1, v));
    this.polySynth.volume.value =
      clamped <= 0 ? -Infinity : 20 * Math.log10(clamped);
  }
}

export const pianoAudio = new PianoAudio();
