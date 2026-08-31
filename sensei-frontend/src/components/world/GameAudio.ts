'use client';

class GameAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientNodes: OscillatorNode[] = [];
  private _volume = 0.5;
  private _muted = false;
  private ready = false;

  async init() {
    if (this.ready) return;
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._volume;
      this.masterGain.connect(this.ctx.destination);
      this.ready = true;
    } catch {}
  }

  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this._muted ? 0 : this._volume, this.ctx.currentTime, 0.1);
    }
  }

  setMuted(m: boolean) {
    this._muted = m;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(m ? 0 : this._volume, this.ctx.currentTime, 0.1);
    }
  }

  private tone(freq: number, startTime: number, dur: number, type: OscillatorType = 'sine', vol = 0.15) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.001, startTime);
    g.gain.linearRampToValueAtTime(vol, startTime + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + dur + 0.05);
  }

  playCorrect() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, t + i * 0.07, 0.25, 'sine', 0.12));
  }

  playWrong() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone(330, t, 0.3, 'triangle', 0.1);
    this.tone(277, t + 0.12, 0.35, 'triangle', 0.1);
  }

  playClick() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.06);
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  playMessage() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone(784, t, 0.15, 'sine', 0.08);
    this.tone(1047, t + 0.1, 0.2, 'sine', 0.08);
  }

  playQuizStart() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [392, 523, 659, 784].forEach((f, i) => this.tone(f, t + i * 0.1, 0.4 - i * 0.05, 'sine', 0.1));
  }

  playCheer() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1000, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(3000, t + 1);
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, t);
    noiseGain.gain.linearRampToValueAtTime(0.05, t + 0.5);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 2);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(t);
    noise.stop(t + 2);
    

    [523, 659, 784, 1047].forEach(f => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.03, t + 0.2);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 1.5);
    });
  }

  playShock() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.tone(150, t, 0.5, 'sawtooth', 0.1);
    this.tone(140, t, 0.6, 'square', 0.1);
  }

  startAmbient() {
    if (!this.ctx || !this.masterGain || this.ambientNodes.length > 0) return;
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.03;
    this.ambientGain.connect(this.masterGain);

    const reverb = this.ctx.createConvolver();
    const len = this.ctx.sampleRate * 2;
    const impulse = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      }
    }
    reverb.buffer = impulse;
    reverb.connect(this.ambientGain);

    const chords = [
      [261.63, 329.63, 392.00],
      [293.66, 369.99, 440.00],
      [246.94, 311.13, 369.99],
    ];

    chords[0].forEach(freq => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.value = 0.02;
      osc.connect(g);
      g.connect(reverb);
      osc.start();
      this.ambientNodes.push(osc);
    });

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.008;
    lfo.connect(lfoGain);
    lfoGain.connect(this.ambientGain.gain);
    lfo.start();
    this.ambientNodes.push(lfo);
  }

  stopAmbient() {
    this.ambientNodes.forEach(n => { try { n.stop(); } catch {} });
    this.ambientNodes = [];
  }

  destroy() {
    this.stopAmbient();
    if (this.ctx) { try { this.ctx.close(); } catch {} }
    this.ctx = null;
    this.ready = false;
  }
}

export const gameAudio = new GameAudioEngine();
export default gameAudio;
