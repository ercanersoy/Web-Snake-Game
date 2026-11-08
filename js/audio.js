'use strict';

// Tüm sesler Web Audio API ile anında üretilir; harici ses dosyası gerekmez.
const Sound = (() => {
  let ctx = null;
  let master = null;
  let sfxBus = null;
  let musicBus = null;
  let noiseBuffer = null;

  const opts = { sfx: true, music: true, volume: 0.6 };

  // Müzik sıralayıcısı
  let musicTimer = null;
  let nextStepTime = 0;
  let step = 0;
  const BPM = 128;
  const STEP_DUR = 60 / BPM / 2; // sekizlik nota

  // Am - F - C - G döngüsü (MIDI nota numaraları, null = sus)
  const MELODY = [
    69, null, 72, 76, 74, 72, 69, null,
    65, null, 69, 72, 71, 69, 65, 67,
    64, null, 67, 72, 71, 67, 64, 67,
    67, null, 71, 74, 72, 71, 67, null,
  ];
  const BASS = [45, 41, 48, 43];

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.connect(ctx.destination);
      sfxBus = ctx.createGain();
      sfxBus.connect(master);
      musicBus = ctx.createGain();
      musicBus.connect(master);

      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

      apply();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function apply() {
    if (!ctx) return;
    master.gain.value = opts.volume;
    sfxBus.gain.value = opts.sfx ? 1 : 0;
    musicBus.gain.value = 0.3;
    if (opts.music) startMusic();
    else stopMusic();
  }

  function configure(settings) {
    opts.sfx = !!settings.sfx;
    opts.music = !!settings.music;
    opts.volume = Math.max(0, Math.min(1, settings.volume));
    apply();
  }

  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

  function tone({ freq, to, dur = 0.12, type = 'square', vol = 0.25, at, bus }) {
    if (!ctx) return;
    const t = at !== undefined ? at : ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(bus || sfxBus);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  function noise({ dur = 0.3, vol = 0.3, freq = 1200, at, bus }) {
    if (!ctx) return;
    const t = at !== undefined ? at : ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(bus || sfxBus);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  // ---- Müzik ----
  function scheduleMusic() {
    while (nextStepTime < ctx.currentTime + 0.12) {
      const t = nextStepTime;
      const n = MELODY[step % MELODY.length];
      if (n !== null) {
        tone({ freq: midi(n), dur: STEP_DUR * 0.9, type: 'triangle', vol: 0.22, at: t, bus: musicBus });
      }
      if (step % 2 === 0) {
        const root = BASS[Math.floor(step / 8) % BASS.length];
        const octave = step % 4 === 0 ? 0 : 12;
        tone({ freq: midi(root + octave), dur: STEP_DUR * 1.6, type: 'square', vol: 0.07, at: t, bus: musicBus });
      } else {
        noise({ dur: 0.04, vol: 0.05, freq: 8000, at: t, bus: musicBus });
      }
      step = (step + 1) % MELODY.length;
      nextStepTime += STEP_DUR;
    }
  }

  function startMusic() {
    if (!ctx || musicTimer) return;
    nextStepTime = ctx.currentTime + 0.05;
    step = 0;
    musicTimer = setInterval(scheduleMusic, 25);
  }

  function stopMusic() {
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  // ---- Efektler ----
  const can = () => ctx && opts.sfx;

  return {
    ensure,
    configure,
    click() {
      if (!can()) return;
      tone({ freq: 660, dur: 0.06, type: 'square', vol: 0.12 });
    },
    eat() {
      if (!can()) return;
      tone({ freq: 520, to: 1040, dur: 0.1, type: 'square', vol: 0.18 });
      tone({ freq: 1040, dur: 0.08, type: 'triangle', vol: 0.15, at: ctx.currentTime + 0.06 });
    },
    aiEat() {
      if (!can()) return;
      tone({ freq: 300, to: 450, dur: 0.09, type: 'sawtooth', vol: 0.08 });
    },
    crash() {
      if (!can()) return;
      noise({ dur: 0.5, vol: 0.45, freq: 2000 });
      tone({ freq: 220, to: 50, dur: 0.5, type: 'sawtooth', vol: 0.2 });
    },
    countdown(final) {
      if (!can()) return;
      tone({ freq: final ? 880 : 440, dur: final ? 0.35 : 0.15, type: 'square', vol: 0.18 });
    },
    win() {
      if (!can()) return;
      const t = ctx.currentTime;
      [60, 64, 67, 72, 76, 79, 84].forEach((n, i) =>
        tone({ freq: midi(n), dur: 0.22, type: 'square', vol: 0.16, at: t + i * 0.09 })
      );
    },
    lose() {
      if (!can()) return;
      const t = ctx.currentTime;
      [67, 63, 60, 55].forEach((n, i) =>
        tone({ freq: midi(n), dur: 0.3, type: 'triangle', vol: 0.22, at: t + 0.35 + i * 0.2 })
      );
    },
    pause() {
      if (!can()) return;
      tone({ freq: 500, to: 300, dur: 0.12, type: 'triangle', vol: 0.15 });
    },
  };
})();
