'use strict';

(() => {
  const settings = loadSettings();
  const canvas = document.getElementById('game');
  const renderer = new Renderer(canvas);

  const $ = (id) => document.getElementById(id);
  const screens = {};
  document.querySelectorAll('.screen').forEach((el) => {
    screens[el.id.replace('screen-', '')] = el;
  });

  // ---- Durum ----
  // menu | countdown | playing | paused | ending | over
  let state = 'menu';
  let game = null;
  let demo = null;
  let demoEndAt = 0;
  let acc = 0;
  let countdown = 0;
  let lastBeep = 0;
  let endingAt = 0;
  let current = 'main';
  let settingsReturn = 'main';

  // ---- Ekranlar ----
  function show(name) {
    for (const [key, el] of Object.entries(screens)) el.classList.toggle('hidden', key !== name);
    current = name;
    $('pause-btn').classList.toggle('hidden', !(name === null && (state === 'playing' || state === 'countdown')));
    if (name === 'setup') refreshSetup();
    if (name === 'settings') refreshSettings();
    if (name) {
      const first = screens[name].querySelector('.btn.primary, button');
      if (first) first.focus({ preventScroll: true });
    }
  }

  function backToMenu(screen = 'main') {
    state = 'menu';
    game = null;
    show(screen);
  }

  function go(target) {
    if (target === 'back') {
      show(settingsReturn);
      return;
    }
    if (target === 'settings') settingsReturn = current;
    if ((target === 'main' || target === 'setup') && (state === 'paused' || state === 'over')) {
      backToMenu(target);
      return;
    }
    show(target);
  }

  document.addEventListener('click', (e) => {
    Sound.ensure();
    const btn = e.target.closest('button');
    if (!btn) return;
    Sound.click();
    if (btn.dataset.go) go(btn.dataset.go);
  });

  // ---- Oyun yapılandırması ----
  const g = settings.game;

  function setSegment(id, value) {
    $(id).querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.value === String(value)));
  }

  function refreshSetup() {
    g.map = ((g.map % MAPS.length) + MAPS.length) % MAPS.length;
    $('map-name').textContent = `${g.map + 1} / ${MAPS.length} · ${mapText(g.map, 'name', I18n.lang)}`;
    $('map-desc').textContent = mapText(g.map, 'desc', I18n.lang);
    drawMapPreview($('map-preview'), g.map, settings, g.humans, g.computers);
    setSegment('opt-humans', g.humans);
    setSegment('opt-computers', g.computers);
    $('controls-hint').textContent = t(g.humans === 2 ? 'setup.controls2' : 'setup.controls1');
    setSegment('opt-difficulty', g.difficulty);
    $('difficulty-field').classList.toggle('disabled', g.computers === 0);
    $('opt-speed').value = g.speed;
    $('opt-speed-val').textContent = `${g.speed} (${t('speed.' + Math.ceil(g.speed / 2))})`;
    $('opt-target').value = g.target;
    $('opt-target-val').textContent = g.target;
    $('opt-foods').value = g.foods;
    $('opt-foods-val').textContent = g.foods;
    if (demo && demo.cfg.map !== g.map) newDemo();
  }

  function changeSetup(fn) {
    fn();
    saveSettings(settings);
    refreshSetup();
  }

  $('map-prev').addEventListener('click', () => changeSetup(() => g.map--));
  $('map-next').addEventListener('click', () => changeSetup(() => g.map++));
  $('opt-difficulty').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) changeSetup(() => (g.difficulty = b.dataset.value));
  });
  $('opt-humans').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) changeSetup(() => (g.humans = Number(b.dataset.value)));
  });
  $('opt-computers').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) changeSetup(() => (g.computers = Number(b.dataset.value)));
  });
  $('opt-speed').addEventListener('input', (e) => changeSetup(() => (g.speed = Number(e.target.value))));
  $('opt-target').addEventListener('input', (e) => changeSetup(() => (g.target = Number(e.target.value))));
  $('opt-foods').addEventListener('input', (e) => changeSetup(() => (g.foods = Number(e.target.value))));
  $('start-btn').addEventListener('click', startGame);

  // ---- Ayarlar ----
  function refreshSettings() {
    $('set-sfx').checked = settings.sfx;
    $('set-music').checked = settings.music;
    $('set-language').value = settings.language;
    $('set-volume').value = Math.round(settings.volume * 100);
    $('set-volume-val').textContent = t('settings.volumeValue', { n: Math.round(settings.volume * 100) });
    document.querySelectorAll('[data-color]').forEach((btn) => {
      btn.querySelector('.swatch').style.background = settings.colors[btn.dataset.color];
      btn.classList.toggle('active', btn.dataset.color === editingColor);
    });
    $('palette').classList.toggle('hidden', !editingColor);
    if (editingColor) {
      const name = document.querySelector(`[data-color="${editingColor}"] [data-i18n]`).textContent;
      $('palette-title').textContent = t('settings.pick', { name });
      const current = settings.colors[editingColor];
      $('palette-grid').querySelectorAll('button').forEach((b) => b.classList.toggle('selected', b.dataset.value === current));
    }
  }

  // Web güvenli palet: 216 renk, klasik 18 × 12 düzende
  let editingColor = null;
  (function buildPalette() {
    const hex = (v) => (v * 51).toString(16).padStart(2, '0').toUpperCase();
    const grid = $('palette-grid');
    for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 18; col++) {
        const r = Math.floor(col / 6) + (row >= 6 ? 3 : 0);
        const gr = row % 6;
        const b = col % 6;
        const color = '#' + hex(r) + hex(gr) + hex(b);
        const btn = document.createElement('button');
        btn.style.background = color;
        btn.dataset.value = color;
        btn.title = color;
        btn.setAttribute('aria-label', color);
        grid.appendChild(btn);
      }
    }
  })();

  function changeSettings(fn) {
    fn();
    saveSettings(settings);
    Sound.configure(settings);
    refreshSettings();
  }

  $('set-sfx').addEventListener('change', (e) => changeSettings(() => (settings.sfx = e.target.checked)));
  $('set-music').addEventListener('change', (e) => changeSettings(() => (settings.music = e.target.checked)));
  $('set-language').addEventListener('change', (e) =>
    changeSettings(() => {
      settings.language = e.target.value;
      I18n.set(settings.language);
    })
  );
  $('set-volume').addEventListener('input', (e) =>
    changeSettings(() => (settings.volume = Number(e.target.value) / 100))
  );
  document.querySelectorAll('[data-color]').forEach((btn) => {
    btn.addEventListener('click', () => {
      editingColor = editingColor === btn.dataset.color ? null : btn.dataset.color;
      refreshSettings();
    });
  });
  $('palette-grid').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b && editingColor) changeSettings(() => (settings.colors[editingColor] = b.dataset.value));
  });
  $('reset-settings').addEventListener('click', () =>
    changeSettings(() => {
      const d = cloneDefaults();
      settings.sfx = d.sfx;
      settings.music = d.music;
      settings.volume = d.volume;
      settings.colors = d.colors;
      editingColor = null;
    })
  );

  // ---- Oyun akışı ----
  const events = {
    onEat(snake) {
      if (snake.kind === 'human') Sound.eat();
      else Sound.aiEat();
    },
    onDeath() {
      Sound.crash();
    },
  };

  function startGame() {
    Sound.ensure();
    game = new Game({ ...g }, events);
    state = 'countdown';
    countdown = 3;
    lastBeep = 4;
    acc = 0;
    show(null);
  }

  function pause() {
    if (state !== 'playing' && state !== 'countdown') return;
    state = 'paused';
    Sound.pause();
    show('pause');
  }

  function resume() {
    if (state !== 'paused') return;
    state = 'countdown';
    countdown = 3;
    lastBeep = 4;
    acc = 0;
    show(null);
  }

  $('pause-btn').addEventListener('click', pause);
  $('resume-btn').addEventListener('click', resume);
  $('restart-btn').addEventListener('click', startGame);
  $('again-btn').addEventListener('click', startGame);
  $('quit-btn').addEventListener('click', () => backToMenu('main'));
  $('over-menu-btn').addEventListener('click', () => backToMenu('main'));

  function showResult() {
    const r = game.result;
    const winners = r.winners;
    const humans = game.snakes.filter((s) => s.kind === 'human');
    const colorOf = (s) => settings.colors[s.colorKey];
    let title;
    let color = settings.colors.food;
    let happy = false;

    if (humans.length === 1) {
      const me = humans[0];
      const lastOut = Math.max(...game.snakes.map((s) => s.diedAt));
      const tied =
        (winners.includes(me) && winners.length > 1) || (r.type === 'allOut' && !me.alive && me.diedAt === lastOut);
      if (tied) {
        title = t('result.draw');
      } else if (winners.includes(me)) {
        title = t('result.win');
        color = colorOf(me);
        happy = true;
      } else {
        title = t('result.lose');
        color = winners.length ? colorOf(winners[0]) : colorOf(me);
      }
    } else if (winners.length === 1) {
      title = t('result.wins', { name: snakeName(game, winners[0], false) });
      color = colorOf(winners[0]);
      happy = winners[0].kind === 'human';
    } else if (winners.length > 1 && winners.every((s) => s.kind === 'ai')) {
      title = t('result.cpusWin');
      color = colorOf(winners[0]);
    } else {
      title = t('result.draw');
    }

    let reason;
    if (r.type === 'target') reason = t('reason.target', { target: game.cfg.target });
    else if (r.type === 'solo') reason = t('reason.solo', { death: t('death.' + game.snakes[0].deathReason) });
    else reason = t('reason.' + r.type);

    if (happy) Sound.win();
    else Sound.lose();

    $('over-title').textContent = title;
    $('over-title').style.color = color;
    $('over-reason').textContent = reason;

    const scores = $('over-scores');
    scores.innerHTML = '';
    for (const s of game.snakes) {
      const el = document.createElement('div');
      el.className = 'score';
      el.innerHTML = '<span></span><b></b><small></small>';
      el.querySelector('span').textContent = snakeName(game, s, false);
      el.querySelector('b').textContent = s.score;
      el.querySelector('b').style.color = colorOf(s);
      el.querySelector('small').textContent = winners.includes(s) ? '🏆' : s.alive ? '' : t('death.' + s.deathReason);
      scores.appendChild(el);
    }
    show('over');
  }

  // ---- Arka plandaki tanıtım oyunu (menüde) ----
  function newDemo() {
    demo = new Game(
      { map: g.map, humans: 1, computers: 1, difficulty: 'hard', speed: 6, target: 999, foods: 6, demo: true },
      {}
    );
    demoEndAt = 0;
  }

  // ---- Giriş ----
  // İki insan oyuncuda: 1. oyuncu W A S D, 2. oyuncu ok tuşları.
  // Tek oyuncuda ikisi de 1. oyuncuyu yönetir.
  const KEYS = {
    KeyW: ['up', 0], KeyS: ['down', 0], KeyA: ['left', 0], KeyD: ['right', 0],
    ArrowUp: ['up', 1], ArrowDown: ['down', 1], ArrowLeft: ['left', 1], ArrowRight: ['right', 1],
  };

  window.addEventListener('keydown', (e) => {
    const key = KEYS[e.code];
    if ((state === 'playing' || state === 'countdown') && key) {
      e.preventDefault();
      const humans = game.snakes.filter((s) => s.kind === 'human').length;
      game.queueDir(humans === 2 ? key[1] : 0, key[0]);
      return;
    }
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (state === 'playing' || state === 'countdown') pause();
      else if (state === 'paused' && current === 'pause') resume();
      else if (e.code === 'Escape') {
        if (current === 'settings') go('back');
        else if (current === 'setup' || current === 'about') go('main');
      }
    }
  });

  let touchStart = null;
  canvas.addEventListener(
    'touchstart',
    (e) => {
      Sound.ensure();
      const t = e.changedTouches[0];
      touchStart = { x: t.clientX, y: t.clientY };
    },
    { passive: true }
  );
  canvas.addEventListener(
    'touchmove',
    (e) => {
      if (!touchStart || !game || (state !== 'playing' && state !== 'countdown')) return;
      e.preventDefault();
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      game.queueDir(0, dir);
      touchStart = { x: t.clientX, y: t.clientY };
    },
    { passive: false }
  );
  canvas.addEventListener('touchend', () => (touchStart = null));

  window.addEventListener('resize', () => renderer.resize());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  });

  // ---- Ana döngü ----
  let last = performance.now();

  function frame(now) {
    const dt = Math.min(250, now - last);
    last = now;

    if (state === 'menu') {
      if (!demo) newDemo();
      acc += dt;
      while (acc >= 90) {
        acc -= 90;
        demo.step();
      }
      if (demo.over || demo.ticks > 4000) {
        if (!demoEndAt) demoEndAt = now + 1500;
        else if (now > demoEndAt) newDemo();
      }
      renderer.render(demo, settings, { hud: false });
    } else {
      if (state === 'countdown') {
        countdown -= dt / 1000;
        const n = Math.ceil(countdown);
        if (n < lastBeep) {
          lastBeep = n;
          Sound.countdown(n <= 0);
        }
        if (countdown <= 0) {
          state = 'playing';
          acc = 0;
        }
      } else if (state === 'playing') {
        acc += dt;
        const tick = game.tickMs;
        while (acc >= tick) {
          acc -= tick;
          game.step();
          if (game.over) {
            state = 'ending';
            endingAt = now + 900;
            $('pause-btn').classList.add('hidden');
            break;
          }
        }
      } else if (state === 'ending' && now >= endingAt) {
        state = 'over';
        showResult();
      }

      const opts = { hud: true };
      if (state === 'countdown') opts.countdown = countdown;
      else if (state === 'playing' && countdown > -0.6) {
        countdown -= dt / 1000;
        opts.countdown = countdown;
      }
      renderer.render(game, settings, opts);
    }
    requestAnimationFrame(frame);
  }

  I18n.set(settings.language);
  Sound.configure(settings);
  show('main');
  requestAnimationFrame(frame);
})();
