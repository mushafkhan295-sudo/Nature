// Procedural Web Audio Ambient Forest Soundscape Synthesizer
// Generates wind gusts, rustling leaves, birdsong trills, and moss hum with zero external 404 assets

export class ForestAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private currentVolume = 0.8;
  private timerIds: number[] = [];
  private listeners: ((playing: boolean) => void)[] = [];

  // Wind nodes
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windLfo: OscillatorNode | null = null;

  // Moss hum nodes
  private mossOsc: OscillatorNode | null = null;
  private mossGain: GainNode | null = null;

  public subscribe(fn: (playing: boolean) => void) {
    this.listeners.push(fn);
    fn(this.isPlaying);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.isPlaying));
  }

  private initContext() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioCtx();

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  // Generate pink-ish noise buffer for realistic wind and leaves
  private createNoiseBuffer(duration = 4): AudioBuffer {
    if (!this.ctx) throw new Error("AudioContext not ready");
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }
    return buffer;
  }

  private startWind() {
    if (!this.ctx || !this.masterGain) return;

    const noiseBuffer = this.createNoiseBuffer(5);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Filter to shape wind tone
    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = "bandpass";
    this.windFilter.frequency.setValueAtTime(380, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    // LFO to modulate wind frequency (gusts)
    this.windLfo = this.ctx.createOscillator();
    this.windLfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // Gentle 12-second wave
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(260, this.ctx.currentTime);
    this.windLfo.connect(lfoGain);
    lfoGain.connect(this.windFilter.frequency);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    noiseSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);

    noiseSource.start();
    this.windLfo.start();
  }

  private startLeavesRustle() {
    if (!this.ctx || !this.masterGain) return;

    const noiseBuffer = this.createNoiseBuffer(3);
    const rustleSource = this.ctx.createBufferSource();
    rustleSource.buffer = noiseBuffer;
    rustleSource.loop = true;

    const rustleFilter = this.ctx.createBiquadFilter();
    rustleFilter.type = "highpass";
    rustleFilter.frequency.setValueAtTime(1800, this.ctx.currentTime);

    const rustleGain = this.ctx.createGain();
    rustleGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

    rustleSource.connect(rustleFilter);
    rustleFilter.connect(rustleGain);
    rustleGain.connect(this.masterGain);

    rustleSource.start();

    // Randomize gentle rustle flutter bursts
    const scheduleRustleBurst = () => {
      if (!this.isPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const burstGain = Math.random() * 0.08 + 0.03;
      const burstDuration = Math.random() * 1.5 + 0.5;

      rustleGain.gain.cancelScheduledValues(now);
      rustleGain.gain.setValueAtTime(rustleGain.gain.value, now);
      rustleGain.gain.linearRampToValueAtTime(burstGain, now + burstDuration * 0.4);
      rustleGain.gain.linearRampToValueAtTime(0.04, now + burstDuration);

      const nextInterval = Math.random() * 3000 + 2000;
      const id = window.setTimeout(scheduleRustleBurst, nextInterval);
      this.timerIds.push(id);
    };

    scheduleRustleBurst();
  }

  private startBirdsongLoop() {
    const playChirp = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

      // Random natural stereophonic position
      if (panner) {
        panner.pan.setValueAtTime((Math.random() - 0.5) * 1.4, now);
      }

      // Bird species pitch profile
      const baseFreq = 2600 + Math.random() * 1200;
      osc.type = "sine";

      // 3-note melodic birdsong motif
      const noteCount = Math.floor(Math.random() * 3) + 2;
      let noteTime = now;

      gain.gain.setValueAtTime(0, now);

      for (let i = 0; i < noteCount; i++) {
        const noteDuration = Math.random() * 0.08 + 0.05;
        const targetFreq = baseFreq + (Math.random() - 0.3) * 800;

        osc.frequency.setValueAtTime(baseFreq, noteTime);
        osc.frequency.exponentialRampToValueAtTime(targetFreq, noteTime + noteDuration * 0.6);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, noteTime + noteDuration);

        gain.gain.linearRampToValueAtTime(0.12, noteTime + noteDuration * 0.3);
        gain.gain.linearRampToValueAtTime(0, noteTime + noteDuration);

        noteTime += noteDuration + (Math.random() * 0.05 + 0.02);
      }

      if (panner) {
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.masterGain);
      } else {
        osc.connect(gain);
        gain.connect(this.masterGain);
      }

      osc.start(now);
      osc.stop(noteTime + 0.1);

      // Schedule next chirp after 2.5s - 7s
      const nextDelay = Math.random() * 4500 + 2500;
      const timer = window.setTimeout(playChirp, nextDelay);
      this.timerIds.push(timer);
    };

    const initialDelay = window.setTimeout(playChirp, 1800);
    this.timerIds.push(initialDelay);
  }

  private startMossHum() {
    if (!this.ctx || !this.masterGain) return;

    // Deep sub-harmonic forest earth tone (55Hz)
    this.mossOsc = this.ctx.createOscillator();
    this.mossOsc.type = "sine";
    this.mossOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

    this.mossGain = this.ctx.createGain();
    this.mossGain.gain.setValueAtTime(0.035, this.ctx.currentTime);

    this.mossOsc.connect(this.mossGain);
    this.mossGain.connect(this.masterGain);

    this.mossOsc.start();
  }

  public async start(): Promise<boolean> {
    try {
      this.initContext();
      if (!this.ctx || !this.masterGain) return false;

      if (this.ctx.state === "suspended") {
        await this.ctx.resume();
      }

      this.isPlaying = true;
      this.notify();

      // Start sound layers
      this.startWind();
      this.startLeavesRustle();
      this.startBirdsongLoop();
      this.startMossHum();

      // Smooth fade-in
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(0, now);
      this.masterGain.gain.linearRampToValueAtTime(0.45 * this.currentVolume, now + 2.0);

      return true;
    } catch (err) {
      console.error("Forest audio start error:", err);
      return false;
    }
  }

  public stop(): boolean {
    if (!this.ctx || !this.masterGain) return false;

    this.isPlaying = false;
    this.notify();
    this.timerIds.forEach(id => clearTimeout(id));
    this.timerIds = [];

    // Smooth fade-out to prevent audio pops
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 1.2);

    setTimeout(() => {
      if (!this.isPlaying && this.ctx && this.ctx.state === "running") {
        this.ctx.suspend();
      }
    }, 1300);

    return false;
  }

  public async toggle(): Promise<boolean> {
    if (this.isPlaying) {
      return this.stop();
    } else {
      return await this.start();
    }
  }

  public setVolume(val: number) {
    this.currentVolume = Math.max(0, Math.min(1, val));
    if (this.isPlaying && this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(0.45 * this.currentVolume, now + 0.15);
    }
  }

  public getVolume(): number {
    return this.currentVolume;
  }

  public getStatus(): boolean {
    return this.isPlaying;
  }
}

// Global singleton instance
export const forestAudio = new ForestAudioEngine();
