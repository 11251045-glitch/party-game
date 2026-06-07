// Custom Web Audio Synthesizer for retro night-market arcade sound effects
class SoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = typeof window !== "undefined" ? localStorage.getItem("party_night_sfx_muted") === "true" : false;

  setMute(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("party_night_sfx_muted", muted ? "true" : "false");
    }
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== "undefined") {
      localStorage.setItem("party_night_sfx_muted", this.isMuted ? "true" : "false");
    }
    return this.isMuted;
  }

  private init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  // 搶答或答錯：低沉嗶聲 / Buzz sound (retro low pitch alarm)
  playBuzz() {
    try {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      console.warn("Audio Context launch blocked by user gesture:", e);
    }
  }

  // 答對或得分：上行明快琶音 / Success chime (happy retro scale)
  playSuccess() {
    try {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Make a cute 2-note arpeggio (C5 -> G5)
      const playNote = (freq: number, delay: number, duration: number) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0.1, now + delay);
        gain.gain.linearRampToValueAtTime(0.01, now + delay + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + duration + 0.05);
      };

      playNote(523.25, 0, 0.15); // C5
      playNote(659.25, 0.08, 0.15); // E5
      playNote(783.99, 0.16, 0.3); // G5
    } catch (e) {
      console.log(e);
    }
  }

  // 倒數計時滴答聲：短促嗶聲 / Countdown tick (short click)
  playTick() {
    try {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(1000, now);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {
      console.log(e);
    }
  }

  // 最終獲勝：盛大的勝利旋律 / Victory Fanfare
  playVictory() {
    try {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const notes = [
        { f: 523.25, d: 0, l: 0.15 }, // C5
        { f: 523.25, d: 0.15, l: 0.15 }, // C5
        { f: 523.25, d: 0.3, l: 0.15 }, // C5
        { f: 523.25, d: 0.45, l: 0.4 }, // C5
        { f: 415.30, d: 0.85, l: 0.4 }, // Ab4
        { f: 466.16, d: 1.25, l: 0.4 }, // Bb4
        { f: 523.25, d: 1.65, l: 0.8 }, // C5
      ];

      notes.forEach((note) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Retro square wave
        osc.type = "square";
        osc.frequency.setValueAtTime(note.f, now + note.d);

        gain.gain.setValueAtTime(0.05, now + note.d);
        gain.gain.linearRampToValueAtTime(0.002, now + note.d + note.l);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + note.d);
        osc.stop(now + note.d + note.l + 0.05);
      });
    } catch (e) {
      console.log(e);
    }
  }
}

export const sfx = new SoundEngine();

class BgmEngine {
  private ctx: AudioContext | null = null;
  private intervalId: any = null;
  private isPlaying: boolean = false;
  public isMuted: boolean = typeof window !== "undefined" ? localStorage.getItem("party_night_bgm_muted") === "true" : false;
  private currentStep: number = 0;

  // Pentatonic scale notes for beautiful light progression (C4, D4, E4, G4, A4, C5, D5, E5, G5, A5)
  private notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];

  // Soft chiptune arpeggio patterns
  private pattern = [
    [0, 5], // C4, C5
    [2, 7], // E4, E5
    [4, 9], // A4, A5
    [3, 8], // G4, G5
    [2, 7], // E4, E5
    [1, 6], // D4, D5
    [3, 8], // G4, G5
    [0, 5], // C4, C5
  ];

  private init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public start() {
    if (this.isMuted) return;
    if (this.isPlaying) return;
    
    this.init();
    this.isPlaying = true;
    this.currentStep = 0;

    const playStep = () => {
      try {
        if (this.isMuted || !this.isPlaying) return;
        this.init();
        if (!this.ctx) return;
        
        if (this.ctx.state === "suspended") {
          this.ctx.resume().catch(() => {});
        }

        const now = this.ctx.currentTime;
        const noteIndices = this.pattern[this.currentStep % this.pattern.length];

        noteIndices.forEach((idx, i) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(this.notes[idx], now);

          // Very low BGM volume so it plays gently in the background
          const volume = i === 0 ? 0.015 : 0.009; 
          gain.gain.setValueAtTime(volume, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + 1.3);
        });

        this.currentStep++;
      } catch (e) {
        console.warn("BGM context error:", e);
      }
    };

    // Play first hit
    playStep();

    // Loop interval matching note decay time
    this.intervalId = setInterval(playStep, 1500);
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("party_night_bgm_muted", muted ? "true" : "false");
    }
    if (muted) {
      this.stop();
    } else {
      this.start();
    }
  }

  public toggleMute(): boolean {
    const nextMute = !this.isMuted;
    this.setMute(nextMute);
    return nextMute;
  }
}

export const bgm = new BgmEngine();

