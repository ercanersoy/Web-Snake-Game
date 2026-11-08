'use strict';

// Çizimde kullanılan bütün renkler web güvenli palete yuvarlanır.

function hexToRgb(hex) {
  const n = parseInt(webSafe(hex).slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// f > 0 açar, f < 0 koyulaştırır; sonuç web güvenli renktir
function shade(hex, f) {
  const { r, g, b } = hexToRgb(hex);
  const t = f < 0 ? 0 : 255;
  const p = Math.abs(f);
  const mix = (c) => Math.round((t - c) * p + c);
  return webSafe('#' + [mix(r), mix(g), mix(b)].map((v) => v.toString(16).padStart(2, '0')).join(''));
}

function isLight(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 140;
}

// Arka plana göre arayüz renkleri (hepsi web güvenli)
function uiColors(background) {
  return isLight(background)
    ? { text: '#000000', sub: '#333333', band: '#CCCCCC', track: '#999999', edge: '#666666' }
    : { text: '#FFFFFF', sub: '#999999', band: '#333333', track: '#666666', edge: '#666666' };
}

function roundRectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Yılanın oyuncuya gösterilen adı
function snakeName(game, s, short) {
  const count = game.snakes.filter((o) => o.role === s.role).length;
  if (s.role === 'p') {
    if (count === 1) return t('name.you');
    return t(short ? 'name.playerShort' : 'name.player', { n: s.num });
  }
  if (count === 1) return t(short ? 'name.cpuShort' : 'name.cpu');
  return t(short ? 'name.cpuNShort' : 'name.cpuN', { n: s.num });
}

const GHOST_MS = 1200; // elenen yılan bu süre boyunca yanıp söner

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = 1;
    this.width = 0;
    this.height = 0;
    this.staticLayer = document.createElement('canvas');
    this.staticKey = '';
    this.resize();
  }

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.staticKey = '';
  }

  layout(withHud) {
    const hud = withHud ? Math.round(Math.max(52, Math.min(72, this.height * 0.08))) : 0;
    const pad = Math.max(8, Math.round(Math.min(this.width, this.height) * 0.015));
    const cell = Math.max(
      4,
      Math.floor(Math.min((this.width - pad * 2) / MAP_W, (this.height - hud - pad * 2) / MAP_H))
    );
    const bw = cell * MAP_W;
    const bh = cell * MAP_H;
    const ox = Math.floor((this.width - bw) / 2);
    const oy = hud + Math.floor((this.height - hud - bh) / 2);
    return { hud, cell, bw, bh, ox, oy };
  }

  // Duvarlar bir kez çizilip önbelleğe alınır.
  drawStatic(game, L, settings) {
    const c = settings.colors;
    const key = [game.map.index, L.cell, L.ox, L.oy, this.width, this.height, this.dpr, c.background, c.wall].join('|');
    if (key === this.staticKey) return;
    this.staticKey = key;

    const cv = this.staticLayer;
    cv.width = this.canvas.width;
    cv.height = this.canvas.height;
    const ctx = cv.getContext('2d');
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    ctx.fillStyle = webSafe(c.background);
    ctx.fillRect(0, 0, this.width, this.height);

    // Harita sınırı (duvar değil, sadece işaret): dışına çıkan kaybeder
    ctx.save();
    ctx.strokeStyle = uiColors(c.background).edge;
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1;
    ctx.strokeRect(L.ox - 1.5, L.oy - 1.5, L.bw + 3, L.bh + 3);
    ctx.restore();

    const s = L.cell;
    const base = webSafe(c.wall);
    const hi = shade(base, 0.5);
    const lo = shade(base, -0.25);
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        if (!game.isWall(x, y)) continue;
        const px = L.ox + x * s;
        const py = L.oy + y * s;
        ctx.fillStyle = base;
        ctx.fillRect(px, py, s, s);
        const b = Math.max(1, Math.round(s * 0.12));
        ctx.fillStyle = hi;
        ctx.fillRect(px, py, s, b);
        ctx.fillRect(px, py, b, s);
        ctx.fillStyle = lo;
        ctx.fillRect(px, py + s - b, s, b);
        ctx.fillRect(px + s - b, py, b, s);
      }
    }
  }

  drawFood(ctx, game, L, color, time) {
    const s = L.cell;
    const base = webSafe(color);
    const hi = shade(base, 0.6);
    game.foods.forEach((f, i) => {
      const age = Math.min(1, (time - f.born) / 250);
      const pulse = 1 + 0.1 * Math.sin(time / 160 + i * 1.7);
      const r = s * 0.36 * pulse * (0.3 + 0.7 * age);
      const cx = L.ox + f.x * s + s / 2;
      const cy = L.oy + f.y * s + s / 2;
      ctx.fillStyle = base;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = hi;
      ctx.beginPath();
      ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  drawSnake(ctx, snake, L, color, time, over) {
    if (!snake.alive) {
      const since = time - snake.diedAt;
      if (since > GHOST_MS && !over) return;
    }
    const s = L.cell;
    const inset = Math.max(1, s * 0.1);
    const len = snake.body.length;
    const base = webSafe(color);
    const dark = shade(base, -0.3);
    ctx.save();
    if (!snake.alive) {
      const since = time - snake.diedAt;
      ctx.globalAlpha = since > GHOST_MS ? 0.4 : Math.sin(time / 70) > 0 ? 0.8 : 0.3;
    }

    // Önce gövde bağlantıları, sonra parçalar (kuyruktan başa)
    for (let i = len - 1; i >= 0; i--) {
      const seg = snake.body[i];
      ctx.fillStyle = i > 0 && i >= len * 0.6 ? dark : base;
      const px = L.ox + seg.x * s;
      const py = L.oy + seg.y * s;
      if (i < len - 1) {
        const nx = snake.body[i + 1];
        if (Math.abs(nx.x - seg.x) + Math.abs(nx.y - seg.y) === 1) {
          const minX = Math.min(seg.x, nx.x);
          const minY = Math.min(seg.y, nx.y);
          const w = seg.x !== nx.x ? 2 * s - inset * 2 : s - inset * 2;
          const h = seg.y !== nx.y ? 2 * s - inset * 2 : s - inset * 2;
          ctx.fillRect(L.ox + minX * s + inset, L.oy + minY * s + inset, w, h);
        }
      }
      roundRectPath(ctx, px + inset, py + inset, s - inset * 2, s - inset * 2, s * (i === 0 ? 0.35 : 0.22));
      ctx.fill();
    }

    // Gözler
    const head = snake.body[0];
    const d = DIRS[snake.dir];
    const cx = L.ox + head.x * s + s / 2;
    const cy = L.oy + head.y * s + s / 2;
    const px = -d.y;
    const py = d.x;
    const er = Math.max(1.5, s * 0.13);
    for (const side of [-1, 1]) {
      const ex = cx + d.x * s * 0.15 + px * side * s * 0.2;
      const ey = cy + d.y * s * 0.15 + py * side * s * 0.2;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ex, ey, er, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(ex + d.x * er * 0.4, ey + d.y * er * 0.4, er * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawHud(ctx, game, L, settings) {
    const c = settings.colors;
    const ui = uiColors(c.background);
    ctx.fillStyle = ui.band;
    ctx.fillRect(0, 0, this.width, L.hud);

    const pad = 16;
    const rightReserve = 64; // duraklat düğmesi için
    const gap = 20;
    const n = game.snakes.length;
    const avail = this.width - pad - rightReserve;
    const colW = Math.min(240, (avail - gap * (n - 1)) / n);
    const size = Math.round(Math.min(L.hud * 0.3, colW / 8));
    const barH = Math.max(4, Math.round(L.hud * 0.1));
    const target = game.cfg.target;
    const short = colW < 170;

    game.snakes.forEach((snake, i) => {
      let x;
      if (n === 1) x = pad;
      else if (n === 2) x = i === 0 ? pad : this.width - rightReserve - colW;
      else x = pad + i * (colW + gap);
      const color = webSafe(c[snake.colorKey]);
      ctx.save();
      if (!snake.alive) ctx.globalAlpha = 0.45;
      ctx.textBaseline = 'alphabetic';
      ctx.font = `700 ${size}px system-ui, sans-serif`;
      const y = L.hud * 0.48;
      ctx.textAlign = 'left';
      ctx.fillStyle = color;
      ctx.fillText(snakeName(game, snake, short) + (snake.alive ? '' : ' ✕'), x, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = ui.text;
      ctx.fillText(`${snake.score} / ${target}`, x + colW, y);
      const by = L.hud * 0.64;
      ctx.fillStyle = ui.track;
      roundRectPath(ctx, x, by, colW, barH, barH / 2);
      ctx.fill();
      const p = Math.min(1, snake.score / target);
      if (p > 0) {
        ctx.fillStyle = color;
        roundRectPath(ctx, x, by, Math.max(barH, colW * p), barH, barH / 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Harita adı yalnızca yer varsa gösterilir
    const centerFree = n === 1 || (n === 2 && this.width - rightReserve - 2 * colW - 2 * pad > 260);
    if (centerFree) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = ui.sub;
      ctx.font = `500 ${Math.round(L.hud * 0.24)}px system-ui, sans-serif`;
      const label = `${game.map.index + 1}. ${mapText(game.map.index, 'name', I18n.lang)}`;
      ctx.fillText(label, n === 2 ? (this.width - rightReserve) / 2 : this.width / 2, L.hud / 2);
    }
  }

  drawCountdown(ctx, value, color) {
    const n = Math.ceil(value);
    const frac = value - Math.floor(value);
    const size = Math.min(this.width, this.height) * 0.22 * (0.8 + 0.4 * frac);
    ctx.save();
    ctx.globalAlpha = 0.3 + 0.7 * frac;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.round(size)}px system-ui, sans-serif`;
    ctx.fillText(n > 0 ? String(n) : t('countdown.go'), this.width / 2, this.height / 2);
    ctx.restore();
  }

  render(game, settings, opts = {}) {
    const ctx = this.ctx;
    const time = performance.now();
    const L = this.layout(!!opts.hud);
    this.drawStatic(game, L, settings);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.staticLayer, 0, 0);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const c = settings.colors;
    this.drawFood(ctx, game, L, c.food, time);
    // Elenen yılanlar altta kalsın
    const order = [...game.snakes].sort((a, b) => Number(a.alive) - Number(b.alive));
    for (const s of order) this.drawSnake(ctx, s, L, c[s.colorKey], time, game.over);

    if (opts.hud) this.drawHud(ctx, game, L, settings);
    if (opts.countdown !== undefined) {
      this.drawCountdown(ctx, opts.countdown, uiColors(c.background).text);
    }
  }
}

// Kurulum ekranındaki küçük harita önizlemesi
function drawMapPreview(canvas, mapIndex, settings, humans, computers) {
  const ctx = canvas.getContext('2d');
  const map = buildMap(mapIndex);
  const c = settings.colors;
  const cell = Math.floor(Math.min(canvas.width / MAP_W, canvas.height / MAP_H));
  const ox = Math.floor((canvas.width - cell * MAP_W) / 2);
  const oy = Math.floor((canvas.height - cell * MAP_H) / 2);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = webSafe(c.background);
  ctx.fillRect(ox, oy, cell * MAP_W, cell * MAP_H);
  ctx.fillStyle = webSafe(c.wall);
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (map.walls[y * MAP_W + x]) ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
    }
  }
  const keys = [];
  for (let i = 1; i <= humans; i++) keys.push('p' + i);
  for (let i = 1; i <= computers; i++) keys.push('c' + i);
  keys.forEach((key, i) => {
    const sp = map.spawns[i];
    const back = DIRS[OPPOSITE[sp.dir]];
    ctx.fillStyle = webSafe(c[key]);
    for (let k = 0; k < START_LENGTH; k++) {
      ctx.fillRect(ox + (sp.x + back.x * k) * cell + 1, oy + (sp.y + back.y * k) * cell + 1, cell - 2, cell - 2);
    }
  });
}
