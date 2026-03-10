export class AudioSystem {
  constructor(scene) {
    this.scene = scene;
    this.ctx = null;
    this.enabled = true;
    this.masterVolume = 0.3;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  // ── Helper methods ──────────────────────────────────────────

  _playTone(type, freq, duration, volume = 1) {
    this.ensureContext();
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(volume * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  }

  _playFreqSweep(type, startFreq, endFreq, duration, volume = 1) {
    this.ensureContext();
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.linearRampToValueAtTime(endFreq, t + duration);
    gain.gain.setValueAtTime(volume * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  }

  _playNoise(duration, volume = 1, filterFreq = 0) {
    this.ensureContext();
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    if (filterFreq > 0) {
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(filterFreq, t);
      filter.Q.setValueAtTime(1, t);
      source.connect(filter);
      filter.connect(gain);
    } else {
      source.connect(gain);
    }
    gain.connect(this.ctx.destination);
    source.start(t);
    source.stop(t + duration);
  }

  // ── Combat sounds ───────────────────────────────────────────

  playHit() {
    this._playTone('square', 80, 0.06, 0.8);
  }

  playMiss() {
    this._playNoise(0.1, 0.4, 2000);
  }

  playKill() {
    this.ensureContext();
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.setValueAtTime(100, t + 0.075);
    gain.gain.setValueAtTime(0.6 * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playDeath() {
    this.ensureContext();
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(60, t);
    osc.frequency.linearRampToValueAtTime(30, t + 0.4);
    gain.gain.setValueAtTime(0.7 * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  // ── Loot sounds ─────────────────────────────────────────────

  playLootCommon() {
    this._playTone('triangle', 800, 0.03, 0.5);
  }

  playLootUncommon() {
    this.ensureContext();
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.setValueAtTime(900, t + 0.04);
    gain.gain.setValueAtTime(0.6 * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  playLootRare() {
    this.ensureContext();
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const freqs = [500, 700, 1000];
    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.05);
      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.5 * this.masterVolume, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + i * 0.05);
      osc.stop(t + 0.15);
    });
  }

  playLootEpic() {
    this.ensureContext();
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    // Main sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(2000, t + 0.2);
    gain.gain.setValueAtTime(0.5 * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
    // Shimmer overtone
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1600, t);
    osc2.frequency.exponentialRampToValueAtTime(4000, t + 0.2);
    gain2.gain.setValueAtTime(0.2 * this.masterVolume, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(t);
    osc2.stop(t + 0.2);
  }

  // ── Progression sounds ──────────────────────────────────────

  playLevelUp() {
    this.ensureContext();
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const notes = [400, 500, 600, 800];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.1);
      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.5 * this.masterVolume, t + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + i * 0.1);
      osc.stop(t + 0.4);
    });
  }

  playSkillLevelUp() {
    this.ensureContext();
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const notes = [350, 440, 525];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.1);
      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.5 * this.masterVolume, t + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + i * 0.1);
      osc.stop(t + 0.3);
    });
  }

  playGold() {
    this.ensureContext();
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2000, t + i * 0.04);
      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(0.5 * this.masterVolume, t + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.02);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.02);
    }
  }

  // ── Activity sounds ─────────────────────────────────────────

  playFishCatch() {
    this.ensureContext();
    if (!this.enabled) return;
    // Splash noise burst + pluck tone
    this._playNoise(0.03, 0.6, 0);
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t + 0.03);
    gain.gain.setValueAtTime(0, t);
    gain.gain.setValueAtTime(0.5 * this.masterVolume, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t + 0.03);
    osc.stop(t + 0.08);
  }

  playFishMiss() {
    this._playFreqSweep('sine', 300, 200, 0.08, 0.4);
  }

  playMineExtract() {
    this._playTone('square', 1200, 0.03, 0.7);
  }

  playMineMiss() {
    this._playTone('square', 100, 0.04, 0.4);
  }

  playCraft() {
    this.ensureContext();
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1000, t);
    gain.gain.setValueAtTime(0.6 * this.masterVolume, t);
    gain.gain.setValueAtTime(0.4 * this.masterVolume, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  playEnhanceSuccess() {
    this._playFreqSweep('sine', 600, 1600, 0.3, 0.6);
  }

  playEnhanceFail() {
    this._playFreqSweep('sawtooth', 400, 100, 0.2, 0.4);
  }

  // ── UI sounds ───────────────────────────────────────────────

  playTap() {
    this._playTone('square', 1000, 0.01, 0.3);
  }

  playPanelOpen() {
    this._playFreqSweep('sine', 300, 500, 0.08, 0.25);
  }

  playPanelClose() {
    this._playFreqSweep('sine', 500, 300, 0.08, 0.25);
  }

  playSave() {
    this._playTone('sine', 800, 0.1, 0.2);
  }

  // ── Gathering / food sounds ─────────────────────────────────

  playHarvest() {
    this.ensureContext();
    if (!this.enabled) return;
    this._playNoise(0.02, 0.4, 0);
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, t + 0.02);
    gain.gain.setValueAtTime(0, t);
    gain.gain.setValueAtTime(0.4 * this.masterVolume, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t + 0.02);
    osc.stop(t + 0.06);
  }

  playEat() {
    this._playNoise(0.06, 0.5, 400);
  }

  // ── Boss sounds ─────────────────────────────────────────────

  playBossWarning() {
    this.ensureContext();
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    // Slow attack
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.6 * this.masterVolume, t + 0.2);
    // Pulsing via LFO-style manual steps
    gain.gain.setValueAtTime(0.3 * this.masterVolume, t + 0.3);
    gain.gain.setValueAtTime(0.6 * this.masterVolume, t + 0.4);
    gain.gain.setValueAtTime(0.3 * this.masterVolume, t + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.6);
  }

  playBossSpawn() {
    this.ensureContext();
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    // Low noise rumble
    const bufferSize = Math.floor(this.ctx.sampleRate * 1.0);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const nFilter = this.ctx.createBiquadFilter();
    nFilter.type = 'lowpass';
    nFilter.frequency.setValueAtTime(100, t);
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0, t);
    nGain.gain.linearRampToValueAtTime(0.4 * this.masterVolume, t + 0.3);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + 1.0);
    // Sub bass
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(40, t);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.5 * this.masterVolume, t + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 1.0);
  }
}
