// Advanced Web Audio API procedural sound system with rich ambient music and dynamic SFX

class SoundSystem {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private musicPlaying = false;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private musicBpm = 128;
  private musicBase = 110; // A2
  private ambientNodes: { osc: OscillatorNode; gain: GainNode; lfo: OscillatorNode; lfoGain: GainNode }[] = [];

  // Phrygian dominant scale for epic cinematic feel
  private scale = [0, 1, 4, 5, 7, 8, 11, 12];
  // Chord progression
  private chords = [
    [0, 4, 7, 12],     // minor tonic
    [0, 3, 7, 10],     // minor 7
    [3, 7, 10, 15],    // augmented / dominant
    [5, 8, 12, 15],    // power subdominant
  ];

  public init() {
    if (this.ctx) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AC();
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.25;
    this.musicGain.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.5;
    this.sfxGain.connect(this.ctx.destination);
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.08;
    this.ambientGain.connect(this.ctx.destination);
  }

  public setSfxVolume(v: number) { if (this.ctx && this.sfxGain) this.sfxGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1); }
  public setMusicVolume(v: number) {
    if (this.ctx && this.musicGain) this.musicGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.1);
    if (this.ctx && this.ambientGain) this.ambientGain.gain.setTargetAtTime(v * 0.35, this.ctx.currentTime, 0.1);
  }

  // ─── Ambient Drone ───
  private startAmbient() {
    if (!this.ctx || !this.ambientGain) return;
    // Two detuned bass oscillators for a war-like ambient drone
    for (let i = 0; i < 2; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 55 * (i === 0 ? 1 : 1.5);
      const gain = this.ctx.createGain();
      gain.gain.value = 0.04;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      filter.Q.value = 2;
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.1 + i * 0.07;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.03;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientGain);
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      osc.start();
      lfo.start();
      this.ambientNodes.push({ osc, gain, lfo, lfoGain });
    }
  }

  private stopAmbient() {
    if (!this.ctx) return;
    for (const node of this.ambientNodes) {
      try { node.osc.stop(); node.lfo.stop(); } catch { /* ignored */ }
    }
    this.ambientNodes = [];
  }

  // ─── Music: arpeggiated cinematic track with bass + melody ───
  public toggleMusic(on: boolean) {
    this.init();
    if (on && !this.musicPlaying) {
      this.musicPlaying = true;
      this.musicStep = 0;
      this.startAmbient();
      this.scheduleMusic();
    } else if (!on && this.musicPlaying) {
      this.musicPlaying = false;
      if (this.musicTimer) { clearTimeout(this.musicTimer); this.musicTimer = null; }
      this.stopAmbient();
    }
  }

  private scheduleMusic() {
    if (!this.musicPlaying || !this.ctx || !this.musicGain) return;

    const now = this.ctx.currentTime;
    const sixteenth = 60 / this.musicBpm / 4; // 16th note
    const chord = this.chords[Math.floor(this.musicStep / 32) % this.chords.length];
    const beat = this.musicStep % 16;

    // Bass on quarter notes
    if (beat % 4 === 0) {
      const bassNote = this.musicBase / 2 * Math.pow(2, chord[0] / 12);
      this.playMusicNote(bassNote, 'sawtooth', sixteenth * 3.5, 0.3, 0.02);
    }

    // Kick drum on beats 1 and 3
    if (beat === 0 || beat === 8) {
      this.playKick(now, 0.15);
    }

    // Hi-hat on off-beats
    if (beat % 2 === 1) {
      this.playHat(now, 0.04);
    }

    // Snare on beats 2 and 4
    if (beat === 4 || beat === 12) {
      this.playSnare(now, 0.08);
    }

    // Arp melody on 8ths - using scale
    if (beat % 1 === 0) {
      const arpPattern = [0, 7, 4, 7, 8, 12, 7, 4, 0, 7, 4, 12, 8, 7, 4, 0];
      const noteIdx = this.scale[arpPattern[beat] % this.scale.length];
      const melNote = this.musicBase * 2 * Math.pow(2, noteIdx / 12);
      this.playMusicNote(melNote, 'square', sixteenth * 0.9, 0.08, 0.01);
    }

    // Occasional lead
    if (this.musicStep % 32 === 16) {
      const leadNote = this.musicBase * 4 * Math.pow(2, this.scale[3] / 12);
      this.playMusicNote(leadNote, 'triangle', sixteenth * 8, 0.1, 0.05);
    }
    if (this.musicStep % 48 === 0) {
      const leadNote = this.musicBase * 4 * Math.pow(2, this.scale[5] / 12);
      this.playMusicNote(leadNote, 'sawtooth', sixteenth * 6, 0.07, 0.04);
    }

    this.musicStep++;
    this.musicTimer = window.setTimeout(() => this.scheduleMusic(), sixteenth * 1000);
  }

  private playMusicNote(freq: number, type: OscillatorType, dur: number, vol: number, attack: number) {
    if (!this.ctx || !this.musicGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(vol, this.ctx.currentTime + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
      // Filter for warmth
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(type === 'square' || type === 'sawtooth' ? 1800 : 3000, this.ctx.currentTime);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc.start();
      osc.stop(this.ctx.currentTime + dur);
    } catch { /* ignored */ }
  }

  private playKick(startTime: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(120, startTime);
      osc.frequency.exponentialRampToValueAtTime(35, startTime + 0.15);
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    } catch { /* ignored */ }
  }

  private playSnare(startTime: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    try {
      const bufSize = this.ctx.sampleRate * 0.12;
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 3);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, startTime);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1000;
      src.connect(filter); filter.connect(gain); gain.connect(this.musicGain);
      src.start(startTime);
    } catch { /* ignored */ }
  }

  private playHat(startTime: number, vol: number) {
    if (!this.ctx || !this.musicGain) return;
    try {
      const bufSize = this.ctx.sampleRate * 0.05;
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 8);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, startTime);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass'; filter.frequency.value = 6000;
      src.connect(filter); filter.connect(gain); gain.connect(this.musicGain);
      src.start(startTime);
    } catch { /* ignored */ }
  }

  // ─── SFX ───
  public playFire(weaponType: string = 'standard') {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain); gain.connect(this.sfxGain);

      // White noise for gunpowder burst
      this.playNoise(now, weaponType === 'nuke' ? 0.5 : 0.15, weaponType === 'nuke' ? 0.7 : 0.35, 800);

      if (weaponType === 'nuke') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 1.5);
        gain.gain.setValueAtTime(0.9, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
        osc.start(now); osc.stop(now + 1.5);
      } else if (weaponType === 'cluster') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
      } else if (weaponType === 'sniper') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
        gain.gain.setValueAtTime(0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now); osc.stop(now + 0.3);
      } else if (weaponType === 'airstrike') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(60, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 1.0);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
        osc.start(now); osc.stop(now + 1.0);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
        gain.gain.setValueAtTime(0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
      }
    } catch { /* ignored */ }
  }

  public playExplosion(radius: number) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const dur = Math.min(2.8, radius / 20 + 0.4);

      // Sub-bass thump
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(15, now + dur * 0.9);
      gain.gain.setValueAtTime(0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + dur);
      osc.connect(gain); gain.connect(this.sfxGain);
      osc.start(now); osc.stop(now + dur);

      // Distorted mid impact
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(80, now);
      osc2.frequency.exponentialRampToValueAtTime(20, now + dur * 0.5);
      gain2.gain.setValueAtTime(0.4, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + dur * 0.5);
      osc2.connect(gain2); gain2.connect(this.sfxGain);
      osc2.start(now); osc2.stop(now + dur * 0.5);

      // Filtered blast noise
      this.playNoise(now, dur, 0.8, radius > 70 ? 250 : 700);

      // Debris scatter (shorter high-frequency clicks)
      if (radius > 50) {
        for (let i = 0; i < 4; i++) {
          this.playNoise(now + 0.05 * i + Math.random() * 0.1, 0.05 + Math.random() * 0.05, 0.15, 2000);
        }
      }
    } catch { /* ignored */ }
  }

  private playNoise(startTime: number, duration: number, volume: number, filterFreq: number) {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const bufSize = this.ctx.sampleRate * duration;
      const buf = this.ctx.createBuffer(1, Math.floor(bufSize), this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, startTime);
      filter.frequency.exponentialRampToValueAtTime(filterFreq * 0.3, startTime + duration);
      src.connect(filter); filter.connect(gain); gain.connect(this.sfxGain);
      src.start(startTime);
    } catch { /* ignored */ }
  }

  public playClick() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.04);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
      osc.connect(gain); gain.connect(this.sfxGain);
      osc.start(now); osc.stop(now + 0.04);
    } catch { /* ignored */ }
  }

  public playPowerup() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      [400, 600, 800, 1000].forEach((freq, i) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.15, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.12);
        osc.connect(gain); gain.connect(this.sfxGain);
        osc.start(now + i * 0.06); osc.stop(now + i * 0.06 + 0.12);
      });
    } catch { /* ignored */ }
  }

  public playVictory() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      // Fanfare
      const notes = [
        { f: 440, t: 0, d: 0.2 }, { f: 554, t: 0.15, d: 0.2 },
        { f: 659, t: 0.3, d: 0.2 }, { f: 880, t: 0.45, d: 0.6 },
        { f: 1108, t: 0.7, d: 0.3 }, { f: 880, t: 1.0, d: 0.6 },
      ];
      notes.forEach((n) => {
        if (!this.ctx || !this.sfxGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now + n.t);
        gain.gain.setValueAtTime(0.35, now + n.t);
        gain.gain.exponentialRampToValueAtTime(0.01, now + n.t + n.d);
        osc.connect(gain); gain.connect(this.sfxGain);
        osc.start(now + n.t); osc.stop(now + n.t + n.d);
      });
      // Cymbal crash
      this.playNoise(now, 1.5, 0.3, 8000);
    } catch { /* ignored */ }
  }

  public playEngineMove() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(60, now);
      osc.frequency.linearRampToValueAtTime(90, now + 0.1);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass'; filter.frequency.value = 400;
      osc.connect(filter); filter.connect(gain); gain.connect(this.sfxGain);
      osc.start(now); osc.stop(now + 0.12);
    } catch { /* ignored */ }
  }
}

export const soundSystem = new SoundSystem();
