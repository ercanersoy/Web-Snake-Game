'use strict';

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// f > 0 açar, f < 0 koyulaştırır
function shade(hex, f) {
  const { r, g, b } = hexToRgb(hex);
  const t = f < 0 ? 0 : 255;
  const p = Math.abs(f);
  const mix = (c) => Math.round((t - c) * p + c);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

function rgba(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function isLight(hex) {
  const { r, g, b } = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 140;
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

  // Duvarlar ve ızgara bir kez çizilip önbelleğe alınır.
  drawStatic(game, L, settings) {
    const c = settings.colors;
    const key = [game.map.index, L.cell, L.ox, L.oy, this.width, this.height, this.dpr, c.background, c.wall, settings.showGrid].join('|');
    if (key === this.staticKey) return;
    this.staticKey = key;

    const cv = this.staticLayer;
    cv.width = this.canvas.width;
    cv.height = this.canvas.height;
    const ctx = cv.getContext('2d');
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    ctx.fillStyle = c.background;
    ctx.fillRect(0, 0, this.width, this.height);

    const lineColor = isLight(c.background) ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.045)';
    if (settings.showGrid) {
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 1; x < MAP_W; x++) {
        const px = L.ox + x * L.cell + 0.5;
        ctx.moveTo(px, L.oy);
        ctx.lineTo(px, L.oy + L.bh);
      }
      for (let y = 1; y < MAP_H; y++) {
        const py = L.oy + y * L.cell + 0.5;
        ctx.moveTo(L.ox, py);
        ctx.lineTo(L.ox + L.bw, py);
      }
      ctx.stroke();
    }

    // Harita sınırı (duvar değil, sadece işaret): dışına çıkan kaybeder
    ctx.save();
    ctx.strokeStyle = isLight(c.background) ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.22)';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1;
    ctx.strokeRect(L.ox - 1.5, L.oy - 1.5, L.bw + 3, L.bh + 3);
    ctx.restore();

    const s = L.cell;
    const hi = shade(c.wall, 0.35);
    const lo = shade(c.wall, -0.35);
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        if (!game.isWall(x, y)) continue;
        const px = L.ox + x * s;
        const py = L.oy + y * s;
        ctx.fillStyle = c.wall;
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
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = s * 0.6;
    game.foods.forEach((f, i) => {
      const age = Math.min(1, (time - f.born) / 250);
      const pulse = 1 + 0.1 * Math.sin(time / 160 + i * 1.7);
      const r = s * 0.34 * pulse * (0.3 + 0.7 * age);
      const cx = L.ox + f.x * s + s / 2;
      const cy = L.oy + f.y * s + s / 2;
      const grad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r);
      grad.addColorStop(0, shade(color, 0.6));
      grad.addColorStop(1, color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  drawSnake(ctx, snake, L, color, time) {
    const s = L.cell;
    const inset = Math.max(1, s * 0.1);
    const len = snake.body.length;
    ctx.save();
    if (!snake.alive) ctx.globalAlpha = 0.35 + 0.35 * (Math.sin(time / 70) > 0 ? 1 : 0);

    // Önce gövde bağlantıları, sonra parçalar (kuyruktan başa)
    for (let i = len - 1; i >= 0; i--) {
      const seg = snake.body[i];
      const t = len > 1 ? i / (len - 1) : 0;
      const fill = i === 0 ? shade(color, 0.15) : shade(color, -0.45 * t);
      ctx.fillStyle = fill;
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
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ex, ey, er, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(ex + d.x * er * 0.4, ey + d.y * er * 0.4, er * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawHud(ctx, game, L, settings) {
    const c = settings.colors;
    const light = isLight(c.background);
    const text = light ? '#111' : '#eee';
    const sub = light ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.55)';
    ctx.fillStyle = light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, 0, this.width, L.hud);

    const pad = 16;
    const rightReserve = 64; // duraklat düğmesi için
    const size = Math.round(L.hud * 0.32);
    const barH = Math.max(4, Math.round(L.hud * 0.1));
    const target = game.cfg.target;
    const compact = this.width < 640;

    const drawScore = (snake, label, color, align) => {
      const barW = Math.min(220, this.width * (compact ? 0.3 : 0.22));
      const x = align === 'left' ? pad : this.width - rightReserve - barW;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.font = `600 ${size}px system-ui, sans-serif`;
      ctx.fillStyle = color;
      const y = L.hud * 0.48;
      ctx.fillText(label, x, y);
      ctx.textAlign = 'right';
      ctx.fillStyle = text;
      ctx.fillText(`${snake.score} / ${target}`, x + barW, y);
      const by = L.hud * 0.64;
      ctx.fillStyle = light ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)';
      roundRectPath(ctx, x, by, barW, barH, barH / 2);
      ctx.fill();
      const p = Math.min(1, snake.score / target);
      if (p > 0) {
        ctx.fillStyle = color;
        roundRectPath(ctx, x, by, Math.max(barH, barW * p), barH, barH / 2);
        ctx.fill();
      }
    };

    drawScore(game.snakes[0], 'Sen', c.player, 'left');
    if (game.snakes[1]) drawScore(game.snakes[1], compact ? 'Bilg.' : 'Bilgisayar', c.ai, 'right');

    if (!compact || !game.snakes[1]) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = sub;
      ctx.font = `500 ${Math.round(size * 0.8)}px system-ui, sans-serif`;
      const label = `${game.map.index + 1}. ${game.map.name} · ${DIFFICULTY[game.cfg.difficulty].label}`;
      const cx = game.snakes[1] ? this.width / 2 - rightReserve / 2 : this.width / 2;
      ctx.fillText(label, cx, L.hud / 2);
    }
  }

  drawCountdown(ctx, value, color) {
    const n = Math.ceil(value);
    const frac = value - Math.floor(value);
    const size = Math.min(this.width, this.height) * 0.22 * (0.8 + 0.4 * frac);
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.75 * frac;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.round(size)}px system-ui, sans-serif`;
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 20;
    ctx.fillText(n > 0 ? String(n) : 'BAŞLA!', this.width / 2, this.height / 2);
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
    game.snakes.forEach((s, i) => this.drawSnake(ctx, s, L, i === 0 ? c.player : c.ai, time));

    if (opts.hud) this.drawHud(ctx, game, L, settings);
    if (opts.countdown !== undefined) {
      this.drawCountdown(ctx, opts.countdown, isLight(c.background) ? '#111' : '#fff');
    }
  }
}

// Kurulum ekranındaki küçük harita önizlemesi
function drawMapPreview(canvas, mapIndex, settings, withOpponent) {
  const ctx = canvas.getContext('2d');
  const map = buildMap(mapIndex);
  const c = settings.colors;
  const cell = Math.floor(Math.min(canvas.width / MAP_W, canvas.height / MAP_H));
  const ox = Math.floor((canvas.width - cell * MAP_W) / 2);
  const oy = Math.floor((canvas.height - cell * MAP_H) / 2);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = c.background;
  ctx.fillRect(ox, oy, cell * MAP_W, cell * MAP_H);
  ctx.fillStyle = c.wall;
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (map.walls[y * MAP_W + x]) ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
    }
  }
  const drawSpawn = (sp, color) => {
    const back = DIRS[OPPOSITE[sp.dir]];
    ctx.fillStyle = color;
    for (let i = 0; i < START_LENGTH; i++) {
      ctx.fillRect(ox + (sp.x + back.x * i) * cell + 1, oy + (sp.y + back.y * i) * cell + 1, cell - 2, cell - 2);
    }
  };
  drawSpawn(map.spawns[0], c.player);
  if (withOpponent) drawSpawn(map.spawns[1], c.ai);
}
