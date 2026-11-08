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
    drawMapPreview($('map-preview'), g.map, settings, g.opponent);
    setSegment('opt-difficulty', g.difficulty);
    setSegment('opt-opponent', g.opponent);
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
  $('opt-opponent').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) changeSetup(() => (g.opponent = b.dataset.value === 'true'));
  });
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
    document.querySelectorAll('[data-color]').forEach((input) => {
      input.value = settings.colors[input.dataset.color];
    });
  }

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
  document.querySelectorAll('[data-color]').forEach((input) => {
    input.addEventListener('input', () => changeSettings(() => (settings.colors[input.dataset.color] = input.value)));
  });
  $('reset-settings').addEventListener('click', () =>
    changeSettings(() => {
      const d = cloneDefaults();
      settings.sfx = d.sfx;
      settings.music = d.music;
      settings.volume = d.volume;
      settings.colors = d.colors;
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
    const player = game.snakes[0];
    const ai = game.snakes[1];
    let title;
    let reason;
    let color;
    if (r.winner === player) {
      title = t('result.win');
      color = settings.colors.player;
      reason =
        r.type === 'score'
          ? t('reason.youFirst', { target: game.cfg.target })
          : t('reason.aiDied', { death: t('death.' + ai.deathReason) });
      Sound.win();
    } else if (r.winner === null && r.type === 'score') {
      title = t('result.draw');
      color = settings.colors.food;
      reason = t('reason.bothTarget');
      Sound.win();
    } else if (r.winner === null && r.dead && r.dead.length === 2) {
      title = t('result.draw');
      color = settings.colors.food;
      reason = player.deathReason === 'head' ? t('reason.headOn') : t('reason.bothDied');
      Sound.lose();
    } else {
      title = t('result.lose');
      color = settings.colors.ai;
      if (r.type === 'score') reason = t('reason.aiFirst', { target: game.cfg.target });
      else reason = t('reason.youDied', { death: t('death.' + player.deathReason) });
      Sound.lose();
    }
    $('over-title').textContent = title;
    $('over-title').style.color = color;
    $('over-reason').textContent = reason;

    const scores = $('over-scores');
    scores.innerHTML = '';
    const add = (label, value, c) => {
      const el = document.createElement('div');
      el.className = 'score';
      el.innerHTML = `<span></span><b></b>`;
      el.querySelector('span').textContent = label;
      el.querySelector('b').textContent = value;
      el.querySelector('b').style.color = c;
      scores.appendChild(el);
    };
    add(t('hud.you'), player.score, settings.colors.player);
    if (ai) add(t('hud.computer'), ai.score, settings.colors.ai);
    show('over');
  }

  // ---- Arka plandaki tanıtım oyunu (menüde) ----
  function newDemo() {
    demo = new Game(
      { map: g.map, difficulty: 'hard', opponent: true, target: 999, foods: 6, demo: true },
      {}
    );
    demoEndAt = 0;
  }

  // ---- Giriş ----
  const KEYS = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
  };

  window.addEventListener('keydown', (e) => {
    const dir = KEYS[e.code];
    if ((state === 'playing' || state === 'countdown') && dir) {
      e.preventDefault();
      game.queueDir(0, dir);
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
