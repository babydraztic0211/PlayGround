export class GameAudio {
  constructor() {
    this.ctx = null
    this.master = null
    this.reverb = null
    this.ambient = null
    this.muted = false
    this.ready = false
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume()
      return
    }
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    this.ctx = new Ctx()
    this.master = this.ctx.createGain()
    this.master.gain.value = this.muted ? 0 : 0.72
    this.master.connect(this.ctx.destination)

    // A small, dark plate reverb for atmosphere.
    const seconds = 1.8
    const rate = this.ctx.sampleRate
    const length = rate * seconds
    const impulse = this.ctx.createBuffer(2, length, rate)
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3.4)
      }
    }
    this.reverb = this.ctx.createConvolver()
    this.reverb.buffer = impulse
    const wet = this.ctx.createGain()
    wet.gain.value = 0.32
    this.reverb.connect(wet)
    wet.connect(this.master)

    this.startAmbience()
    this.ready = true
  }

  setMuted(value) {
    this.muted = value
    if (this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime)
      this.master.gain.linearRampToValueAtTime(value ? 0 : 0.72, this.ctx.currentTime + 0.15)
    }
  }

  toggle() {
    this.setMuted(!this.muted)
    return this.muted
  }

  connect(node, wet = 0.35) {
    node.connect(this.master)
    if (this.reverb) {
      const send = this.ctx.createGain()
      send.gain.value = wet
      node.connect(send)
      send.connect(this.reverb)
    }
  }

  tone(freq, duration, type = 'sine', gain = 0.05, when = 0, slideTo = null) {
    if (!this.ctx || this.muted) return
    const t = this.ctx.currentTime + when
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + duration)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    osc.connect(g)
    this.connect(g, 0.3)
    osc.start(t)
    osc.stop(t + duration + 0.03)
  }

  noise(duration, freq, gain = 0.05, when = 0, q = 0.8, type = 'bandpass', sweepTo = null) {
    if (!this.ctx || this.muted) return
    const t = this.ctx.currentTime + when
    const rate = this.ctx.sampleRate
    const length = Math.max(1, Math.floor(rate * duration))
    const buffer = this.ctx.createBuffer(1, length, rate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
    const src = this.ctx.createBufferSource()
    src.buffer = buffer
    const filter = this.ctx.createBiquadFilter()
    filter.type = type
    filter.frequency.setValueAtTime(freq, t)
    if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, t + duration)
    filter.Q.value = q
    const g = this.ctx.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(gain, t + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    src.connect(filter)
    filter.connect(g)
    this.connect(g, 0.28)
    src.start(t)
    src.stop(t + duration + 0.03)
  }

  startAmbience() {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    const bus = this.ctx.createGain()
    bus.gain.value = 0.55
    this.connect(bus, 0.65)

    const low = this.ctx.createOscillator()
    low.type = 'sine'
    low.frequency.value = 43.65
    const lowGain = this.ctx.createGain()
    lowGain.gain.value = 0.038
    low.connect(lowGain)
    lowGain.connect(bus)
    low.start(t)

    const fifth = this.ctx.createOscillator()
    fifth.type = 'triangle'
    fifth.frequency.value = 65.41
    const fifthGain = this.ctx.createGain()
    fifthGain.gain.value = 0.016
    fifth.connect(fifthGain)
    fifthGain.connect(bus)
    fifth.start(t)

    const high = this.ctx.createOscillator()
    high.type = 'sine'
    high.frequency.value = 174.61
    const highGain = this.ctx.createGain()
    highGain.gain.value = 0.0035
    const highLfo = this.ctx.createOscillator()
    highLfo.frequency.value = 0.07
    const highLfoGain = this.ctx.createGain()
    highLfoGain.gain.value = 0.003
    highLfo.connect(highLfoGain)
    highLfoGain.connect(highGain.gain)
    high.connect(highGain)
    highGain.connect(bus)
    high.start(t)
    highLfo.start(t)

    // Wind bed
    const rate = this.ctx.sampleRate
    const length = rate * 4
    const buffer = this.ctx.createBuffer(1, length, rate)
    const data = buffer.getChannelData(0)
    let last = 0
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.2
    }
    const wind = this.ctx.createBufferSource()
    wind.buffer = buffer
    wind.loop = true
    const windFilter = this.ctx.createBiquadFilter()
    windFilter.type = 'lowpass'
    windFilter.frequency.value = 520
    windFilter.Q.value = 0.4
    const windGain = this.ctx.createGain()
    windGain.gain.value = 0.05
    const windLfo = this.ctx.createOscillator()
    windLfo.frequency.value = 0.055
    const windLfoGain = this.ctx.createGain()
    windLfoGain.gain.value = 0.022
    windLfo.connect(windLfoGain)
    windLfoGain.connect(windGain.gain)
    wind.connect(windFilter)
    windFilter.connect(windGain)
    windGain.connect(bus)
    wind.start(t)
    windLfo.start(t)

    this.ambient = { bus, low, fifth, high, wind }
  }

  swing(heavy = false) {
    this.noise(heavy ? 0.4 : 0.26, heavy ? 380 : 620, heavy ? 0.13 : 0.085, 0, 1.1, 'bandpass', heavy ? 120 : 240)
    this.tone(heavy ? 110 : 160, 0.12, 'triangle', 0.025, 0, heavy ? 70 : 110)
  }

  hit(crit = false) {
    this.noise(0.16, crit ? 1600 : 900, crit ? 0.13 : 0.08, 0, 0.7, 'bandpass', 180)
    this.tone(crit ? 72 : 58, 0.24, 'sine', 0.15, 0, 34)
    if (crit) this.tone(980, 0.12, 'square', 0.025, 0.01, 620)
  }

  hurt() {
    this.tone(92, 0.4, 'sawtooth', 0.1, 0, 38)
    this.noise(0.32, 240, 0.12, 0, 0.9, 'lowpass', 90)
  }

  pickup(rare = false) {
    const base = rare ? 523.25 : 659.25
    this.tone(base, 0.18, 'sine', 0.045)
    this.tone(base * 1.5, 0.24, 'sine', 0.03, 0.06)
    if (rare) this.tone(base * 2, 0.36, 'sine', 0.025, 0.14)
  }

  craft() {
    this.noise(0.5, 1800, 0.06, 0, 2.4, 'bandpass', 420)
    this.tone(130.81, 0.7, 'triangle', 0.09, 0)
    this.tone(196, 0.9, 'sine', 0.05, 0.12)
    this.tone(261.63, 1.2, 'sine', 0.035, 0.24)
  }

  flask() {
    this.tone(310, 0.25, 'sine', 0.04, 0, 460)
    this.tone(620, 0.4, 'sine', 0.025, 0.08)
    this.noise(0.18, 1300, 0.025, 0.04, 1.4)
  }

  levelUp() {
    const notes = [261.63, 329.63, 392, 523.25]
    notes.forEach((n, i) => this.tone(n, 1.2, 'sine', 0.035, i * 0.1))
    this.tone(65.41, 1.8, 'triangle', 0.06, 0)
  }

  wave() {
    this.tone(55, 1.8, 'sine', 0.13, 0, 41)
    this.tone(110, 1.4, 'triangle', 0.045, 0.1)
    this.noise(1.2, 180, 0.05, 0, 0.8, 'lowpass')
  }

  bossRoar() {
    this.tone(46, 1.8, 'sawtooth', 0.18, 0, 31)
    this.tone(69, 1.4, 'square', 0.07, 0.05, 42)
    this.noise(1.6, 420, 0.12, 0, 0.6, 'lowpass', 80)
  }

  death() {
    this.tone(98, 2.2, 'sine', 0.1, 0, 32)
    this.tone(49, 2.6, 'triangle', 0.12, 0.1, 24)
    this.noise(2.0, 300, 0.08, 0, 0.7, 'lowpass', 60)
  }

  victory() {
    const notes = [130.81, 164.81, 196, 261.63, 329.63]
    notes.forEach((n, i) => this.tone(n, 2.8, 'sine', 0.045, i * 0.22))
    this.tone(65.41, 4, 'triangle', 0.06, 0)
  }

  ui() {
    this.tone(720, 0.06, 'sine', 0.018, 0, 600)
  }
}
