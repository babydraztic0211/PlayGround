// Procedural dark-fantasy soundscape and effects. No external audio assets.
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.dry = null;
    this.wet = null;
    this.noiseBuffer = null;
    this.reverb = null;
    this.enabled = true;
    this.started = false;
    this.ambient = null;
    this.dripTimer = 4;
    this.heartTimer = 0;
    try {
      this.enabled = localStorage.getItem('gloamvein.sound') !== 'off';
    } catch {
      this.enabled = true;
    }
  }

  setEnabled(value) {
    this.enabled = value;
    try {
      localStorage.setItem('gloamvein.sound', value ? 'on' : 'off');
    } catch {}
    if (!this.ctx) {
      if (value) this.start();
      return;
    }
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(value ? 0.72 : 0.0001, now, 0.15);
    if (value) this.ctx.resume().catch(() => {});
  }

  toggle() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  start() {
    if (!this.enabled) return;
    if (this.ctx) {
      this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.72;
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 22;
      compressor.ratio.value = 5;
      compressor.attack.value = 0.005;
      compressor.release.value = 0.28;
      this.master.connect(compressor);
      compressor.connect(this.ctx.destination);

      this.dry = this.ctx.createGain();
      this.dry.gain.value = 0.85;
      this.dry.connect(this.master);

      this.reverb = this.makeReverb(2.8);
      this.wet = this.ctx.createGain();
      this.wet.gain.value = 0.32;
      this.wet.connect(this.reverb);
      this.reverb.connect(this.master);

      this.noiseBuffer = this.makeNoise(2.0);
      this.started = true;
      this.startAmbient();
      this.ctx.resume().catch(() => {});
    } catch (error) {
      console.warn('Audio unavailable', error);
      this.ctx = null;
    }
  }

  makeNoise(seconds) {
    const rate = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, rate * seconds, rate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = last * 0.96 + white * 0.04;
      data[i] = last * 3.2;
    }
    return buffer;
  }

  makeReverb(seconds) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const impulse = this.ctx.createBuffer(2, length, rate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i += 1) {
        const t = i / length;
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.8) * (1 - t * 0.25);
      }
    }
    const convolver = this.ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }

  startAmbient() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const amb = ctx.createGain();
    amb.gain.value = 0.0001;
    amb.gain.setTargetAtTime(0.55, ctx.currentTime, 1.6);
    amb.connect(this.master);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 210;
    filter.Q.value = 0.9;
    filter.connect(amb);

    const freqs = [41.2, 55, 82.4, 61.7];
    const oscs = freqs.map((freq, index) => {
      const osc = ctx.createOscillator();
      osc.type = index % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      osc.detune.value = (index - 1.5) * 4.5;
      const gain = ctx.createGain();
      gain.gain.value = index === 0 ? 0.16 : 0.045;
      osc.connect(gain);
      gain.connect(filter);
      osc.start();
      return { osc, gain };
    });

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.037;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 86;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const air = ctx.createBufferSource();
    air.buffer = this.noiseBuffer;
    air.loop = true;
    const airFilter = ctx.createBiquadFilter();
    airFilter.type = 'bandpass';
    airFilter.frequency.value = 330;
    airFilter.Q.value = 0.55;
    const airGain = ctx.createGain();
    airGain.gain.value = 0.026;
    air.connect(airFilter);
    airFilter.connect(airGain);
    airGain.connect(amb);
    air.start();

    const airLfo = ctx.createOscillator();
    airLfo.frequency.value = 0.061;
    const airLfoGain = ctx.createGain();
    airLfoGain.gain.value = 0.014;
    airLfo.connect(airLfoGain);
    airLfoGain.connect(airGain.gain);
    airLfo.start();

    this.ambient = { amb, filter, oscs, air, airFilter, airGain, lfo, airLfo };
  }

  bus(pan = 0) {
    const ctx = this.ctx;
    const out = ctx.createGain();
    if (pan !== 0 && ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      out.connect(panner);
      panner.connect(this.dry);
      panner.connect(this.wet);
    } else {
      out.connect(this.dry);
      out.connect(this.wet);
    }
    return out;
  }

  tone({ freq = 220, endFreq = null, dur = 0.3, type = 'sine', vol = 0.1, pan = 0, attack = 0.005, detune = 0, delay = 0 }) {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.detune.value = detune;
    osc.frequency.setValueAtTime(Math.max(20, freq), start);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + dur);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain);
    gain.connect(this.bus(pan));
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  noise({ dur = 0.25, vol = 0.08, type = 'bandpass', freq = 900, endFreq = null, Q = 0.8, pan = 0, delay = 0 }) {
    if (!this.ctx || !this.enabled) return;
    const ctx = this.ctx;
    const start = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(freq, start);
    if (endFreq) filter.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), start + dur);
    filter.Q.value = Q;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.bus(pan));
    src.start(start);
    src.stop(start + dur + 0.05);
  }

  swing() {
    this.noise({ dur: 0.16, vol: 0.045, type: 'bandpass', freq: 620, endFreq: 240, Q: 0.7 });
  }

  hitOre(kind = 'ember', pan = 0) {
    const base = { ember: 196, gloam: 330, blood: 150, soul: 392 }[kind] || 196;
    this.noise({ dur: 0.09, vol: 0.075, type: 'highpass', freq: 1300, pan });
    this.tone({ freq: base * 2.4, endFreq: base * 1.7, dur: 0.11, type: 'triangle', vol: 0.055, pan });
    this.tone({ freq: base, endFreq: base * 0.72, dur: 0.14, type: 'square', vol: 0.022, pan });
  }

  breakOre(kind = 'ember', pan = 0) {
    const base = { ember: 196, gloam: 330, blood: 146, soul: 392 }[kind] || 196;
    this.noise({ dur: 0.38, vol: 0.14, type: 'lowpass', freq: 1600, endFreq: 220, Q: 0.7, pan });
    this.noise({ dur: 0.2, vol: 0.09, type: 'highpass', freq: 2400, pan });
    this.tone({ freq: base * 3, endFreq: base * 2, dur: 0.6, type: 'sine', vol: 0.07, pan });
    this.tone({ freq: base, endFreq: base * 0.5, dur: 0.4, type: 'triangle', vol: 0.04, pan });
  }

  pickup(kind = 'ember', pan = 0) {
    const base = { ember: 523, gloam: 659, blood: 392, soul: 784 }[kind] || 523;
    this.tone({ freq: base, dur: 0.09, type: 'sine', vol: 0.055, pan });
    this.tone({ freq: base * 1.5, dur: 0.14, type: 'sine', vol: 0.035, pan, delay: 0.055 });
  }

  hurt(pan = 0) {
    this.noise({ dur: 0.3, vol: 0.12, type: 'lowpass', freq: 900, endFreq: 180, pan });
    this.tone({ freq: 130, endFreq: 58, dur: 0.4, type: 'sawtooth', vol: 0.06, pan });
  }

  enemyHit(pan = 0) {
    this.noise({ dur: 0.14, vol: 0.1, type: 'bandpass', freq: 420, Q: 0.6, pan });
    this.tone({ freq: 180, endFreq: 90, dur: 0.16, type: 'square', vol: 0.035, pan });
  }

  enemyDeath(pan = 0) {
    this.tone({ freq: 300, endFreq: 42, dur: 0.9, type: 'sawtooth', vol: 0.045, pan });
    this.noise({ dur: 0.7, vol: 0.08, type: 'lowpass', freq: 1000, endFreq: 120, pan });
  }

  step(pan = 0, heavy = false) {
    this.noise({ dur: 0.09, vol: heavy ? 0.035 : 0.022, type: 'lowpass', freq: 380, endFreq: 190, pan });
  }

  upgrade() {
    const notes = [392, 523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      this.tone({ freq, dur: 0.65, type: 'triangle', vol: 0.045, delay: i * 0.085 });
      this.tone({ freq: freq * 2, dur: 0.4, type: 'sine', vol: 0.018, delay: i * 0.085 });
    });
    this.noise({ dur: 0.8, vol: 0.05, type: 'bandpass', freq: 1600, endFreq: 500 });
  }

  denied(pan = 0) {
    this.tone({ freq: 110, endFreq: 82, dur: 0.35, type: 'square', vol: 0.035, pan });
    this.tone({ freq: 116.5, endFreq: 87, dur: 0.35, type: 'triangle', vol: 0.03, pan });
  }

  gateOpen() {
    this.tone({ freq: 55, dur: 2.2, type: 'sine', vol: 0.08 });
    this.tone({ freq: 82.4, dur: 1.8, type: 'triangle', vol: 0.045, delay: 0.2 });
    this.noise({ dur: 1.6, vol: 0.06, type: 'bandpass', freq: 240, endFreq: 900, Q: 1.2 });
  }

  descend() {
    this.tone({ freq: 45, endFreq: 28, dur: 1.8, type: 'sine', vol: 0.12 });
    this.noise({ dur: 1.5, vol: 0.08, type: 'lowpass', freq: 800, endFreq: 70 });
    [261.6, 311.1, 392].forEach((freq, i) => this.tone({ freq, dur: 1.4, type: 'triangle', vol: 0.025, delay: 0.25 + i * 0.12 }));
  }

  bossHit(pan = 0) {
    this.noise({ dur: 0.24, vol: 0.15, type: 'lowpass', freq: 1200, endFreq: 150, pan });
    this.tone({ freq: 98, endFreq: 44, dur: 0.5, type: 'sawtooth', vol: 0.06, pan });
    this.tone({ freq: 1046, endFreq: 700, dur: 0.4, type: 'sine', vol: 0.035, pan });
  }

  victory() {
    [261.63, 329.63, 392, 523.25, 659.25].forEach((freq, i) => {
      this.tone({ freq, dur: 3.2, type: 'sine', vol: 0.05, delay: i * 0.18 });
      this.tone({ freq: freq / 2, dur: 3.8, type: 'triangle', vol: 0.028, delay: i * 0.18 });
    });
    this.noise({ dur: 3.4, vol: 0.06, type: 'bandpass', freq: 600, endFreq: 2400, Q: 0.5 });
  }

  drip() {
    const pan = Math.random() * 1.6 - 0.8;
    const base = 700 + Math.random() * 800;
    this.tone({ freq: base, endFreq: base * 0.45, dur: 0.18, type: 'sine', vol: 0.022, pan });
    this.tone({ freq: base * 0.3, dur: 0.5, type: 'sine', vol: 0.012, pan, delay: 0.03 });
  }

  heartbeat() {
    this.tone({ freq: 58, endFreq: 38, dur: 0.18, type: 'sine', vol: 0.08 });
    this.tone({ freq: 52, endFreq: 34, dur: 0.16, type: 'sine', vol: 0.055, delay: 0.24 });
  }

  uiClick() {
    this.tone({ freq: 760, endFreq: 520, dur: 0.07, type: 'triangle', vol: 0.025 });
  }

  update(dt, { critical = false, playing = false } = {}) {
    if (!this.ctx || !this.enabled) return;
    this.dripTimer -= dt;
    if (this.dripTimer <= 0) {
      this.dripTimer = 5 + Math.random() * 11;
      if (playing) this.drip();
    }
    if (critical && playing) {
      this.heartTimer -= dt;
      if (this.heartTimer <= 0) {
        this.heartTimer = 1.05;
        this.heartbeat();
      }
    } else {
      this.heartTimer = 0;
    }
  }
}
