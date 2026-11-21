// Nightjar audio: every sound is synthesized with WebAudio — soft steps,
// a tossed coin's ring, the page-turn of a photographed ledger, alarm
// stings and a low night-time drone. No audio files, nothing to load.

export class SoundFX {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.ctx = null;
    this.master = null;
    this.drone = null;
  }

  unlock() {
    if (!this.enabled || this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.startDrone();
  }

  tone(freq, dur, type = 'sine', gain = 0.15, when = 0, slideTo = null) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(this.master);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  noiseBurst(dur, gain = 0.05, freq = 900) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = freq; filter.Q.value = 0.8;
    const g = this.ctx.createGain(); g.gain.value = gain;
    src.connect(filter); filter.connect(g); g.connect(this.master);
    src.start(t0);
  }

  startDrone() {
    if (!this.ctx || this.drone) return;
    const g = this.ctx.createGain();
    g.gain.value = 0.035;
    const o1 = this.ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 55;
    const o2 = this.ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 55 * 1.5;
    const o3 = this.ctx.createOscillator(); o3.type = 'triangle'; o3.frequency.value = 110.3;
    const g3 = this.ctx.createGain(); g3.gain.value = 0.3;
    o1.connect(g); o2.connect(g); o3.connect(g3); g3.connect(g);
    g.connect(this.master);
    o1.start(); o2.start(); o3.start();
    this.drone = { g, o1, o2, o3 };
  }

  play(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'step': this.noiseBurst(0.05, 0.035, 500); break;
      case 'step-soft': this.noiseBurst(0.04, 0.012, 420); break;
      case 'coin':
        this.tone(2093, 0.35, 'sine', 0.12);
        this.tone(2637, 0.5, 'sine', 0.08, 0.05);
        break;
      case 'page':
        this.noiseBurst(0.16, 0.09, 1600);
        this.tone(660, 0.12, 'triangle', 0.05, 0.02);
        break;
      case 'alarm-sting':
        this.tone(392, 0.16, 'square', 0.07);
        this.tone(392, 0.16, 'square', 0.07, 0.2);
        break;
      case 'caught':
        this.tone(220, 0.5, 'sawtooth', 0.14, 0, 110);
        this.tone(110, 0.7, 'square', 0.1, 0.08, 55);
        break;
      case 'clear':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.09, i * 0.09));
        break;
      case 'suspicion': this.tone(880, 0.09, 'sine', 0.05); break;
    }
  }
}
