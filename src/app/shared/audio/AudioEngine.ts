import * as Tone from "tone";

/**
 * Piano-like audio engine using a carefully tuned Tone.js PolySynth.
 *
 * Strategy: Use soft triangle wave with gentle low-pass filtering
 * and subtle reverb to create a mellow, piano-like tone.
 */
export class PianoAudio {
  private pianoSynth: Tone.PolySynth | null = null;
  private feedbackSynth: Tone.Synth | null = null;
  private reverb: Tone.Reverb | null = null;
  private lowPass: Tone.Filter | null = null;
  private started = false;
  private _initPromise: Promise<void> | null = null;

  isReady(): boolean {
    return this.started;
  }

  async init(): Promise<void> {
    if (this._initPromise) return this._initPromise;
    if (this.started) return;

    this._initPromise = (async () => {
      try {
        await Tone.start();
        console.log("PianoAudio: Tone.start() called");

        // Warm reverb — small room, very subtle
        this.reverb = new Tone.Reverb({
          decay: 1.8,
          preDelay: 0.02,
          wet: 0.15,
        }).toDestination();
        await this.reverb.generate();

        // Gentle low-pass to round off harsh high-end
        this.lowPass = new Tone.Filter({
          frequency: 4800,
          Q: 0.3,
          type: "lowpass",
          rolloff: -12,
        }).connect(this.reverb);

        // Soft piano-like polysynth
        // Triangle wave for warm, mellow tone
        this.pianoSynth = new Tone.PolySynth(Tone.Synth, {
          oscillator: {
            type: "triangle",
            detune: -5,
          },
          envelope: {
            attack: 0.005,
            decay: 1.4,
            sustain: 0.06,
            release: 2.0,
          },
        }).connect(this.lowPass);
        this.pianoSynth.volume.value = -12;
        this.pianoSynth.maxPolyphony = 8;

        // Feedback synth (soft sine wave)
        this.feedbackSynth = new Tone.Synth({
          oscillator: { type: "sine" },
          envelope: {
            attack: 0.015,
            decay: 0.4,
            sustain: 0.0,
            release: 0.7,
          },
        }).connect(this.lowPass);
        this.feedbackSynth.volume.value = -12;

        this.started = true;
        console.log("PianoAudio: initialized (soft triangle piano)");
      } catch (e) {
        console.warn("PianoAudio: init failed", e);
      }
    })();

    return this._initPromise;
  }

  play(note: string): void {
    if (!this.started || !this.pianoSynth) {
      console.warn("PianoAudio.play: not ready");
      return;
    }
    try {
      this.pianoSynth.triggerAttackRelease(note, "2n");
    } catch (e) {
      console.warn("PianoAudio.play failed", note, e);
    }
  }

  playSuccess(): void {
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

  playError(): void {
    if (!this.feedbackSynth || !this.started) return;
    try {
      const now = Tone.now();
      this.feedbackSynth.triggerAttackRelease("F4", "8n", now);
      this.feedbackSynth.triggerAttackRelease("E4", "4n", now + 0.12);
    } catch (e) {
      console.warn("PianoAudio.playError failed", e);
    }
  }

  playChord(notes: string[]): void {
    if (!this.started || !this.pianoSynth || !notes || notes.length === 0) return;
    try {
      notes.forEach((note) => this.pianoSynth!.triggerAttackRelease(note, "2n"));
    } catch (e) {
      console.warn("PianoAudio.playChord failed", notes, e);
    }
  }

  playArpeggio(notes: string[], intervalMs = 120): void {
    if (!this.started || !this.pianoSynth || !notes || notes.length === 0) return;
    try {
      const now = Tone.now();
      notes.forEach((note, i) => {
        this.pianoSynth!.triggerAttackRelease(
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
    const clamped = Math.max(0, Math.min(1, v));
    Tone.Destination.volume.value = clamped <= 0 ? -Infinity : 20 * Math.log10(clamped);
  }
}

export const pianoAudio = new PianoAudio();
