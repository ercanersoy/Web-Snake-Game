'use strict';

// Harita boyutu (hücre cinsinden). Tüm haritalar aynı boyuttadır.
const MAP_W = 40;
const MAP_H = 26;

// Varsayılan başlangıç noktaları: [oyuncu, bilgisayar]
const DEFAULT_SPAWNS = [
  { x: 6, y: 3, dir: 'right' },
  { x: 33, y: 22, dir: 'left' },
];

function makeGrid() {
  const g = [];
  for (let y = 0; y < MAP_H; y++) g.push(new Array(MAP_W).fill(0));
  return g;
}

function fillRect(g, x, y, w, h, value = 1) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      if (i >= 0 && i < MAP_W && j >= 0 && j < MAP_H) g[j][i] = value;
    }
  }
}

function clearRect(g, x, y, w, h) {
  fillRect(g, x, y, w, h, 0);
}

function frame(g, x, y, w, h) {
  fillRect(g, x, y, w, 1);
  fillRect(g, x, y + h - 1, w, 1);
  fillRect(g, x, y, 1, h);
  fillRect(g, x + w - 1, y, 1, h);
}

function border(g) {
  frame(g, 0, 0, MAP_W, MAP_H);
}

const MAPS = [
  {
    name: 'Açık Alan',
    desc: 'Hiç duvar yok, ama kenarlardan dışarı çıkan kaybeder.',
    build() {
      return makeGrid();
    },
  },
  {
    name: 'Kutu',
    desc: 'Dört bir yanı duvarlarla çevrili klasik arena.',
    build() {
      const g = makeGrid();
      border(g);
      return g;
    },
  },
  {
    name: 'Dört Blok',
    desc: 'Kapalı arenanın içinde dört büyük blok.',
    build() {
      const g = makeGrid();
      border(g);
      fillRect(g, 8, 6, 5, 4);
      fillRect(g, 27, 6, 5, 4);
      fillRect(g, 8, 16, 5, 4);
      fillRect(g, 27, 16, 5, 4);
      return g;
    },
  },
  {
    name: 'Artı',
    desc: 'Ortada dev bir artı işareti, kenarlar açık.',
    build() {
      const g = makeGrid();
      fillRect(g, 6, 12, 28, 2);
      fillRect(g, 19, 5, 2, 16);
      return g;
    },
  },
  {
    name: 'Koridorlar',
    desc: 'Uzun yatay duvarlar arasında dolambaçlı koridorlar.',
    build() {
      const g = makeGrid();
      border(g);
      fillRect(g, 1, 7, 30, 1);
      fillRect(g, 9, 13, 30, 1);
      fillRect(g, 1, 19, 30, 1);
      return g;
    },
    spawns: [
      { x: 6, y: 3, dir: 'right' },
      { x: 33, y: 22, dir: 'left' },
    ],
  },
  {
    name: 'Labirent',
    desc: 'Dikey duvarlar ve engellerle dolu basit bir labirent.',
    build() {
      const g = makeGrid();
      border(g);
      fillRect(g, 10, 1, 1, 17);
      fillRect(g, 20, 8, 1, 17);
      fillRect(g, 30, 1, 1, 17);
      fillRect(g, 3, 12, 4, 1);
      fillRect(g, 14, 4, 3, 1);
      fillRect(g, 24, 4, 3, 1);
      fillRect(g, 14, 20, 3, 1);
      fillRect(g, 24, 20, 3, 1);
      fillRect(g, 34, 12, 4, 1);
      return g;
    },
    spawns: [
      { x: 5, y: 22, dir: 'right' },
      { x: 34, y: 22, dir: 'left' },
    ],
  },
  {
    name: 'Çerçeveler',
    desc: 'İç içe geçmiş, kapılı çerçeveler.',
    build() {
      const g = makeGrid();
      border(g);
      frame(g, 6, 5, 28, 16);
      clearRect(g, 18, 5, 4, 1);
      clearRect(g, 18, 20, 4, 1);
      clearRect(g, 6, 12, 1, 2);
      clearRect(g, 33, 12, 1, 2);
      frame(g, 13, 9, 14, 8);
      clearRect(g, 13, 12, 1, 2);
      clearRect(g, 26, 12, 1, 2);
      return g;
    },
  },
  {
    name: 'Adalar',
    desc: 'Arenaya dağılmış küçük duvar adacıkları.',
    build() {
      const g = makeGrid();
      border(g);
      for (let j = 0; j < 4; j++) {
        for (let i = 0; i < 5; i++) {
          const x = 5 + i * 7 + (j % 2 ? 3 : 0);
          const y = 5 + j * 5;
          fillRect(g, x, y, 2, 2);
        }
      }
      return g;
    },
  },
  {
    name: 'Zikzak',
    desc: 'Sırayla yukarıdan ve aşağıdan uzanan duvarlar.',
    build() {
      const g = makeGrid();
      border(g);
      fillRect(g, 8, 1, 1, 19);
      fillRect(g, 16, 6, 1, 19);
      fillRect(g, 24, 1, 1, 19);
      fillRect(g, 32, 6, 1, 19);
      return g;
    },
    spawns: [
      { x: 4, y: 22, dir: 'right' },
      { x: 35, y: 3, dir: 'left' },
    ],
  },
  {
    name: 'Kale',
    desc: 'Kapıları dışarı açılan bir kale. Kapılardan çıkan kaybeder!',
    build() {
      const g = makeGrid();
      border(g);
      clearRect(g, 18, 0, 4, 1);
      clearRect(g, 18, MAP_H - 1, 4, 1);
      clearRect(g, 0, 11, 1, 4);
      clearRect(g, MAP_W - 1, 11, 1, 4);
      fillRect(g, 5, 4, 3, 3);
      fillRect(g, 32, 4, 3, 3);
      fillRect(g, 5, 19, 3, 3);
      fillRect(g, 32, 19, 3, 3);
      frame(g, 14, 8, 12, 10);
      clearRect(g, 18, 17, 4, 1);
      clearRect(g, 18, 8, 4, 1);
      return g;
    },
    spawns: [
      { x: 6, y: 2, dir: 'right' },
      { x: 33, y: 23, dir: 'left' },
    ],
  },
];

// Haritayı oyunda kullanılacak biçime dönüştürür.
function buildMap(index) {
  const def = MAPS[index];
  const grid = def.build();
  const walls = new Uint8Array(MAP_W * MAP_H);
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) walls[y * MAP_W + x] = grid[y][x];
  }
  return {
    index,
    name: def.name,
    desc: def.desc,
    width: MAP_W,
    height: MAP_H,
    walls,
    spawns: def.spawns || DEFAULT_SPAWNS,
  };
}

if (typeof module !== 'undefined') module.exports = { MAPS, MAP_W, MAP_H, buildMap };
