'use strict';

const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const DIR_NAMES = ['up', 'down', 'left', 'right'];
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' };

const START_LENGTH = 4;

// Hız 1 (yavaş) – 10 (çok hızlı); bir adımın süresi milisaniye cinsinden
function speedToTick(speed) {
  return Math.round(200 * Math.pow(0.86, speed - 1));
}

class Snake {
  /**
   * kind: 'human' | 'ai'
   * role: 'p' (insan oyuncu) | 'c' (bilgisayar); num: 1 | 2
   */
  constructor(id, kind, role, num, spawn) {
    this.id = id;
    this.kind = kind;
    this.role = role;
    this.num = num;
    this.colorKey = role + num; // p1, p2, c1, c2
    this.dir = spawn.dir;
    this.queue = [];
    this.score = 0;
    this.alive = true;
    this.deathReason = null;
    this.diedAt = 0;
    const back = DIRS[OPPOSITE[spawn.dir]];
    this.body = [];
    for (let i = 0; i < START_LENGTH; i++) {
      this.body.push({ x: spawn.x + back.x * i, y: spawn.y + back.y * i });
    }
  }

  get head() {
    return this.body[0];
  }
}

class Game {
  /**
   * cfg: { map, humans, computers, difficulty, speed, target, foods, demo }
   * events: { onEat(snake), onDeath(snakes) }
   */
  constructor(cfg, events = {}) {
    this.cfg = cfg;
    this.events = events;
    this.map = buildMap(cfg.map);
    this.w = this.map.width;
    this.h = this.map.height;
    this.reset();
  }

  reset() {
    const sp = this.map.spawns;
    this.snakes = [];
    for (let i = 0; i < this.cfg.humans; i++) {
      const id = this.snakes.length;
      this.snakes.push(new Snake(id, this.cfg.demo ? 'ai' : 'human', 'p', i + 1, sp[id]));
    }
    for (let i = 0; i < this.cfg.computers; i++) {
      const id = this.snakes.length;
      this.snakes.push(new Snake(id, 'ai', 'c', i + 1, sp[id]));
    }
    this.foods = [];
    this.over = false;
    this.result = null;
    this.ticks = 0;
    this.refillFood();
  }

  get tickMs() {
    return speedToTick(this.cfg.speed);
  }

  get alive() {
    return this.snakes.filter((s) => s.alive);
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  isWall(x, y) {
    return this.map.walls[y * this.w + x] === 1;
  }

  foodIndexAt(x, y) {
    return this.foods.findIndex((f) => f.x === x && f.y === y);
  }

  refillFood() {
    const want = this.cfg.foods;
    if (this.foods.length >= want) return;
    const taken = new Uint8Array(this.w * this.h);
    for (let i = 0; i < taken.length; i++) taken[i] = this.map.walls[i];
    for (const s of this.alive) for (const c of s.body) taken[c.y * this.w + c.x] = 1;
    for (const f of this.foods) taken[f.y * this.w + f.x] = 1;
    const free = [];
    for (let i = 0; i < taken.length; i++) if (!taken[i]) free.push(i);
    while (this.foods.length < want && free.length) {
      const k = Math.floor(Math.random() * free.length);
      const idx = free[k];
      free[k] = free[free.length - 1];
      free.pop();
      this.foods.push({ x: idx % this.w, y: Math.floor(idx / this.w), born: performance.now() });
    }
  }

  // Oyuncu yön değiştirdiğinde çağrılır. Hızlı tuş basışları sıraya alınır.
  queueDir(snakeIndex, dir) {
    const s = this.snakes[snakeIndex];
    if (!s || s.kind !== 'human' || !s.alive) return;
    const last = s.queue.length ? s.queue[s.queue.length - 1] : s.dir;
    if (dir === last || dir === OPPOSITE[last]) return;
    if (s.queue.length < 3) s.queue.push(dir);
  }

  step() {
    if (this.over) return;
    this.ticks++;
    const alive = this.alive;

    // 1) Yönleri belirle
    for (const s of alive) {
      if (s.kind === 'human') {
        if (s.queue.length) s.dir = s.queue.shift();
      } else {
        s.dir = aiChooseDir(this, s);
      }
    }

    // 2) Yeni baş konumlarını hesapla
    const plans = new Map();
    for (const s of alive) {
      const d = DIRS[s.dir];
      const nh = { x: s.head.x + d.x, y: s.head.y + d.y };
      const inside = this.inBounds(nh.x, nh.y);
      plans.set(s, { nh, inside, eats: inside && this.foodIndexAt(nh.x, nh.y) >= 0 });
    }

    // 3) Doluluk: bu turda hareket edecek kuyruk hücreleri boş sayılır
    const owner = new Int8Array(this.w * this.h).fill(-1);
    for (const s of alive) {
      const n = s.body.length - (plans.get(s).eats ? 0 : 1);
      for (let k = 0; k < n; k++) owner[s.body[k].y * this.w + s.body[k].x] = s.id;
    }

    // 4) Çarpışmaları kontrol et
    const dead = [];
    const headCount = new Map();
    for (const s of alive) {
      const { nh, inside } = plans.get(s);
      if (inside) {
        const key = nh.y * this.w + nh.x;
        headCount.set(key, (headCount.get(key) || 0) + 1);
      }
    }
    for (const s of alive) {
      const { nh, inside } = plans.get(s);
      let reason = null;
      if (!inside) reason = 'out';
      else if (this.isWall(nh.x, nh.y)) reason = 'wall';
      else {
        const o = owner[nh.y * this.w + nh.x];
        if (o === s.id) reason = 'self';
        else if (o >= 0) reason = 'snake';
        else if (headCount.get(nh.y * this.w + nh.x) > 1) reason = 'head';
      }
      if (reason) {
        s.deathReason = reason;
        dead.push(s);
      }
    }

    // 5) Elenmeyenleri hareket ettir ve yemleri ye
    const now = performance.now();
    for (const s of dead) {
      s.alive = false;
      s.diedAt = now;
    }
    if (dead.length && this.events.onDeath) this.events.onDeath(dead);

    for (const s of alive) {
      if (!s.alive) continue;
      const { nh, eats } = plans.get(s);
      s.body.unshift(nh);
      if (eats) {
        this.foods.splice(this.foodIndexAt(nh.x, nh.y), 1);
        s.score++;
        if (this.events.onEat) this.events.onEat(s);
      } else {
        s.body.pop();
      }
    }
    this.refillFood();
    this.checkEnd(dead);
  }

  // Oyunun bitip bitmediğine karar verir.
  checkEnd(dead) {
    const alive = this.alive;

    // Hedef puana ulaşan kazanır (aynı anda birden fazlaysa berabere)
    const reached = alive.filter((s) => s.score >= this.cfg.target);
    if (reached.length) return this.end('target', reached);

    // Tek yılanlı oyunda elenmek kaybetmektir
    if (this.snakes.length === 1) {
      if (!alive.length) return this.end('solo', []);
      return;
    }

    // Herkes aynı anda elendiyse berabere
    if (!alive.length) return this.end('allOut', []);

    // Ayakta kalan son yılan kazanır
    if (alive.length === 1) return this.end('last', alive);

    // Bütün insan oyuncular elendiyse kalan bilgisayarlar kazanır
    const hadHumans = this.snakes.some((s) => s.kind === 'human');
    if (hadHumans && !alive.some((s) => s.kind === 'human')) return this.end('humansOut', alive);
  }

  end(type, winners) {
    this.over = true;
    this.result = { type, winners };
  }
}

// ---------------------------------------------------------------------------
// Bilgisayar yılanlarının yapay zekâsı
// ---------------------------------------------------------------------------

function buildBlocked(game) {
  const blocked = new Uint8Array(game.w * game.h);
  for (let i = 0; i < blocked.length; i++) blocked[i] = game.map.walls[i];
  for (const s of game.snakes) {
    if (!s.alive) continue;
    // Kuyruk ucu bir sonraki adımda büyük ihtimalle boşalacak
    for (let k = 0; k < s.body.length - 1; k++) blocked[s.body[k].y * game.w + s.body[k].x] = 1;
  }
  return blocked;
}

function floodArea(game, blocked, sx, sy, limit) {
  const W = game.w;
  const seen = new Uint8Array(blocked.length);
  const stack = [sy * W + sx];
  seen[sy * W + sx] = 1;
  let count = 0;
  while (stack.length && count < limit) {
    const idx = stack.pop();
    count++;
    const x = idx % W;
    const y = (idx - x) / W;
    for (const d of DIR_NAMES) {
      const nx = x + DIRS[d].x;
      const ny = y + DIRS[d].y;
      if (!game.inBounds(nx, ny)) continue;
      const n = ny * W + nx;
      if (seen[n] || blocked[n]) continue;
      seen[n] = 1;
      stack.push(n);
    }
  }
  return count;
}

// Başlangıç seçeneklerinden en yakın yeme giden ilk adımı bulur (BFS).
function bfsToFood(game, blocked, options) {
  const W = game.w;
  const foodSet = new Set(game.foods.map((f) => f.y * W + f.x));
  if (!foodSet.size) return null;
  const firstDir = new Int8Array(blocked.length).fill(-1);
  const queue = [];
  for (const o of options) {
    const idx = o.y * W + o.x;
    if (firstDir[idx] !== -1) continue;
    firstDir[idx] = DIR_NAMES.indexOf(o.dir);
    queue.push(idx);
  }
  for (let qi = 0; qi < queue.length; qi++) {
    const idx = queue[qi];
    if (foodSet.has(idx)) return DIR_NAMES[firstDir[idx]];
    const x = idx % W;
    const y = (idx - x) / W;
    for (const d of DIR_NAMES) {
      const nx = x + DIRS[d].x;
      const ny = y + DIRS[d].y;
      if (!game.inBounds(nx, ny)) continue;
      const n = ny * W + nx;
      if (blocked[n] || firstDir[n] !== -1) continue;
      firstDir[n] = firstDir[idx];
      queue.push(n);
    }
  }
  return null;
}

function aiChooseDir(game, snake) {
  const level = game.cfg.difficulty;
  const blocked = buildBlocked(game);
  const head = snake.head;
  const rivals = game.snakes.filter((s) => s !== snake && s.alive);

  const options = [];
  for (const d of DIR_NAMES) {
    if (d === OPPOSITE[snake.dir]) continue;
    const nx = head.x + DIRS[d].x;
    const ny = head.y + DIRS[d].y;
    if (!game.inBounds(nx, ny) || blocked[ny * game.w + nx]) continue;
    // Başka bir yılanın başının yanına girmek kafa kafaya çarpışma riskidir
    const risky = rivals.some((r) => Math.abs(r.head.x - nx) + Math.abs(r.head.y - ny) === 1);
    options.push({ dir: d, x: nx, y: ny, risky });
  }
  if (!options.length) return snake.dir; // Kaçış yok

  let pool = options;
  if (level !== 'easy') {
    const safe = options.filter((o) => !o.risky);
    if (safe.length) pool = safe;
  }

  // Kolay: açgözlü yaklaşım ve ara sıra rastgele hamle
  if (level === 'easy') {
    if (Math.random() < 0.12) return pool[Math.floor(Math.random() * pool.length)].dir;
    let best = pool[0];
    let bestDist = Infinity;
    for (const o of pool) {
      for (const f of game.foods) {
        const dist = Math.abs(f.x - o.x) + Math.abs(f.y - o.y);
        if (dist < bestDist) {
          bestDist = dist;
          best = o;
        }
      }
    }
    return best.dir;
  }

  const target = bfsToFood(game, blocked, pool);
  const len = snake.body.length;

  // Zor: yeme giden yol çıkmaz sokağa giriyorsa güvenli yönü tercih et
  if (level === 'hard' || !target) {
    blocked[head.y * game.w + head.x] = 1;
    const areas = pool.map((o) => floodArea(game, blocked, o.x, o.y, len * 3));
    const need = len + 2;
    if (target) {
      const ti = pool.findIndex((o) => o.dir === target);
      if (areas[ti] >= need) return target;
    }
    let bi = 0;
    for (let i = 1; i < pool.length; i++) if (areas[i] > areas[bi]) bi = i;
    return pool[bi].dir;
  }

  return target;
}

if (typeof module !== 'undefined') module.exports = { Game, speedToTick };
