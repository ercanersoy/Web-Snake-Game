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

// Her haritanın adı ve açıklaması dile göre verilir.
// "en" hem Amerikan hem İngiliz İngilizcesi içindir; yazımı farklıysa "gb" ayrıca verilir.
const MAPS = [
  {
    name: { tr: 'Açık Alan', en: 'Open Field' },
    desc: {
      tr: 'Hiç duvar yok, ama kenarlardan dışarı çıkan kaybeder.',
      en: 'No walls at all, but leaving the edges means you lose.',
    },
    build() {
      return makeGrid();
    },
  },
  {
    name: { tr: 'Kutu', en: 'The Box' },
    desc: {
      tr: 'Dört bir yanı duvarlarla çevrili klasik arena.',
      en: 'The classic arena, walled in on every side.',
    },
    build() {
      const g = makeGrid();
      border(g);
      return g;
    },
  },
  {
    name: { tr: 'Dört Blok', en: 'Four Blocks' },
    desc: {
      tr: 'Kapalı arenanın içinde dört büyük blok.',
      en: 'Four large blocks inside a closed arena.',
    },
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
    name: { tr: 'Artı', en: 'Plus' },
    desc: {
      tr: 'Ortada dev bir artı işareti, kenarlar açık.',
      en: 'A giant plus sign in the center, with open edges.',
      gb: 'A giant plus sign in the centre, with open edges.',
    },
    build() {
      const g = makeGrid();
      fillRect(g, 6, 12, 28, 2);
      fillRect(g, 19, 5, 2, 16);
      return g;
    },
  },
  {
    name: { tr: 'Koridorlar', en: 'Corridors' },
    desc: {
      tr: 'Uzun yatay duvarlar arasında dolambaçlı koridorlar.',
      en: 'Winding corridors between long horizontal walls.',
    },
    build() {
      const g = makeGrid();
      border(g);
      fillRect(g, 1, 7, 30, 1);
      fillRect(g, 9, 13, 30, 1);
      fillRect(g, 1, 19, 30, 1);
      return g;
    },
  },
  {
    name: { tr: 'Labirent', en: 'Maze' },
    desc: {
      tr: 'Dikey duvarlar ve engellerle dolu basit bir labirent.',
      en: 'A simple maze of vertical walls and obstacles.',
    },
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
    name: { tr: 'Çerçeveler', en: 'Frames' },
    desc: {
      tr: 'İç içe geçmiş, kapılı çerçeveler.',
      en: 'Nested frames with doorways.',
    },
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
    name: { tr: 'Adalar', en: 'Islands' },
    desc: {
      tr: 'Arenaya dağılmış küçük duvar adacıkları.',
      en: 'Small islands of wall scattered across the arena.',
    },
    build() {
      const g = makeGrid();
      border(g);
      for (let j = 0; j < 4; j++) {
        for (let i = 0; i < 5; i++) {
          fillRect(g, 5 + i * 7 + (j % 2 ? 3 : 0), 5 + j * 5, 2, 2);
        }
      }
      return g;
    },
  },
  {
    name: { tr: 'Zikzak', en: 'Zigzag' },
    desc: {
      tr: 'Sırayla yukarıdan ve aşağıdan uzanan duvarlar.',
      en: 'Walls reaching in from the top and bottom in turn.',
    },
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
    name: { tr: 'Kale', en: 'Castle' },
    desc: {
      tr: 'Kapıları dışarı açılan bir kale. Kapılardan çıkan kaybeder!',
      en: 'A castle whose gates open to the outside. Leave through one and you lose!',
    },
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
  {
    name: { tr: 'Sarmal', en: 'Spiral' },
    desc: {
      tr: 'Merkeze doğru daralan bir sarmal.',
      en: 'A spiral that tightens toward the center.',
      gb: 'A spiral that tightens towards the centre.',
    },
    build() {
      const g = makeGrid();
      border(g);
      fillRect(g, 4, 4, 32, 1);
      fillRect(g, 35, 4, 1, 18);
      fillRect(g, 8, 21, 28, 1);
      fillRect(g, 8, 8, 1, 14);
      fillRect(g, 8, 8, 24, 1);
      fillRect(g, 31, 8, 1, 10);
      fillRect(g, 12, 17, 20, 1);
      fillRect(g, 12, 12, 1, 6);
      fillRect(g, 12, 12, 16, 1);
      return g;
    },
    spawns: [
      { x: 6, y: 2, dir: 'right' },
      { x: 33, y: 23, dir: 'left' },
    ],
  },
  {
    name: { tr: 'İki Oda', en: 'Two Rooms' },
    desc: {
      tr: 'İki kapıyla birbirine bağlanan iki büyük oda.',
      en: 'Two large rooms joined by two doors.',
    },
    build() {
      const g = makeGrid();
      border(g);
      fillRect(g, 19, 1, 2, 24);
      clearRect(g, 19, 5, 2, 3);
      clearRect(g, 19, 18, 2, 3);
      return g;
    },
  },
  {
    name: { tr: 'Dört Oda', en: 'Four Rooms' },
    desc: {
      tr: 'Kapılarla birbirine açılan dört oda.',
      en: 'Four rooms that open onto each other through doors.',
    },
    build() {
      const g = makeGrid();
      border(g);
      fillRect(g, 1, 12, 38, 2);
      fillRect(g, 19, 1, 2, 24);
      clearRect(g, 19, 5, 2, 3);
      clearRect(g, 19, 18, 2, 3);
      clearRect(g, 8, 12, 3, 2);
      clearRect(g, 29, 12, 3, 2);
      return g;
    },
  },
  {
    name: { tr: 'Elmas', en: 'Diamond' },
    desc: {
      tr: 'Ortada dört kapılı bir elmas.',
      en: 'A diamond with four openings in the middle of the arena.',
    },
    build() {
      const g = makeGrid();
      border(g);
      for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
          const d = Math.abs(x - 20) + Math.abs(y - 13);
          if ((d === 9 || d === 10) && Math.abs(y - 13) > 1 && Math.abs(x - 20) > 1) g[y][x] = 1;
        }
      }
      return g;
    },
  },
  {
    name: { tr: 'Sütunlar', en: 'Pillars' },
    desc: {
      tr: 'Düzenli aralıklarla dizilmiş tek hücrelik sütunlar.',
      en: 'Single-cell pillars set out in a regular grid.',
    },
    build() {
      const g = makeGrid();
      border(g);
      for (let y = 4; y <= 20; y += 4) {
        for (let x = 4; x <= 36; x += 4) g[y][x] = 1;
      }
      return g;
    },
  },
  {
    name: { tr: 'Tünel', en: 'Tunnel' },
    desc: {
      tr: 'Ortadan geçen uzun bir tünel, kenarlar açık.',
      en: 'A long tunnel through the middle, with open edges.',
    },
    build() {
      const g = makeGrid();
      fillRect(g, 4, 9, 32, 1);
      fillRect(g, 4, 16, 32, 1);
      fillRect(g, 12, 3, 1, 4);
      fillRect(g, 27, 19, 1, 4);
      return g;
    },
  },
  {
    name: { tr: 'Halkalar', en: 'Rings' },
    desc: {
      tr: 'Yan yana iki halka; içlerine kapılardan girilir.',
      en: 'Two rings side by side, entered through their gaps.',
    },
    build() {
      const g = makeGrid();
      border(g);
      frame(g, 5, 5, 12, 16);
      frame(g, 23, 5, 12, 16);
      clearRect(g, 16, 11, 1, 4);
      clearRect(g, 23, 11, 1, 4);
      clearRect(g, 10, 5, 2, 1);
      clearRect(g, 28, 20, 2, 1);
      return g;
    },
  },
  {
    name: { tr: 'Tarak', en: 'Comb' },
    desc: {
      tr: 'Yukarıdan ve aşağıdan uzanan tarak dişleri.',
      en: 'Comb teeth reaching down from the top and up from the bottom.',
    },
    build() {
      const g = makeGrid();
      border(g);
      for (let x = 5; x < 35; x += 6) fillRect(g, x, 1, 1, 14);
      for (let x = 8; x < 38; x += 6) fillRect(g, x, 11, 1, 14);
      return g;
    },
    spawns: [
      { x: 2, y: 6, dir: 'down' },
      { x: 37, y: 20, dir: 'up' },
    ],
  },
  {
    name: { tr: 'Merdiven', en: 'Staircase' },
    desc: {
      tr: 'Çapraz inen iki basamaklı duvar.',
      en: 'Two stepped walls running diagonally across the arena.',
    },
    build() {
      const g = makeGrid();
      border(g);
      for (let i = 0; i < 6; i++) {
        fillRect(g, 6 + i * 5, 3 + i * 3, 5, 1);
        fillRect(g, 10 + i * 5, 3 + i * 3, 1, 3);
      }
      for (let i = 0; i < 5; i++) {
        fillRect(g, 6 + i * 5, 9 + i * 3, 5, 1);
        fillRect(g, 10 + i * 5, 9 + i * 3, 1, 3);
      }
      return g;
    },
    spawns: [
      { x: 5, y: 1, dir: 'right' },
      { x: 37, y: 10, dir: 'down' },
    ],
  },
  {
    name: { tr: 'Köşeler', en: 'Corners' },
    desc: {
      tr: 'Köşelerde L biçimli duvarlar, kenarlar açık.',
      en: 'L-shaped walls in the corners, with open edges.',
    },
    build() {
      const g = makeGrid();
      fillRect(g, 2, 2, 8, 1);
      fillRect(g, 2, 2, 1, 6);
      fillRect(g, 30, 2, 8, 1);
      fillRect(g, 37, 2, 1, 6);
      fillRect(g, 2, 23, 8, 1);
      fillRect(g, 2, 18, 1, 6);
      fillRect(g, 30, 23, 8, 1);
      fillRect(g, 37, 18, 1, 6);
      fillRect(g, 17, 11, 6, 4);
      return g;
    },
  },
  {
    name: { tr: 'H Harfi', en: 'Letter H' },
    desc: {
      tr: 'Arenanın ortasında kocaman bir H harfi.',
      en: 'A huge letter H in the middle of the arena.',
    },
    build() {
      const g = makeGrid();
      border(g);
      fillRect(g, 10, 5, 2, 16);
      fillRect(g, 28, 5, 2, 16);
      fillRect(g, 12, 12, 16, 2);
      return g;
    },
  },
  {
    name: { tr: 'Nehir', en: 'River' },
    desc: {
      tr: 'Arenayı ikiye bölen kalın bir duvar ve üç köprü.',
      en: 'A thick wall splits the arena, crossed by three bridges.',
    },
    build() {
      const g = makeGrid();
      border(g);
      fillRect(g, 18, 1, 4, 24);
      clearRect(g, 18, 4, 4, 3);
      clearRect(g, 18, 12, 4, 2);
      clearRect(g, 18, 19, 4, 3);
      return g;
    },
  },
  {
    name: { tr: 'Artılar', en: 'Crosses' },
    desc: {
      tr: 'Arenaya düzenli dizilmiş küçük artı işaretleri.',
      en: 'Small plus signs laid out evenly across the arena.',
    },
    build() {
      const g = makeGrid();
      border(g);
      for (const cy of [7, 13, 19]) {
        for (const cx of [8, 16, 24, 32]) {
          fillRect(g, cx - 1, cy, 3, 1);
          fillRect(g, cx, cy - 1, 1, 3);
        }
      }
      return g;
    },
  },
  {
    name: { tr: 'Kum Saati', en: 'Hourglass' },
    desc: {
      tr: 'Köşelerden ortaya uzanan çapraz duvarlar.',
      en: 'Diagonal walls stretching from the corners toward the middle.',
      gb: 'Diagonal walls stretching from the corners towards the middle.',
    },
    build() {
      const g = makeGrid();
      border(g);
      for (let i = 0; i < 10; i++) {
        fillRect(g, 3 + i, 2 + i, 2, 1);
        fillRect(g, 35 - i, 2 + i, 2, 1);
        fillRect(g, 3 + i, 23 - i, 2, 1);
        fillRect(g, 35 - i, 23 - i, 2, 1);
      }
      return g;
    },
    spawns: [
      { x: 20, y: 4, dir: 'left' },
      { x: 19, y: 21, dir: 'right' },
    ],
  },
  {
    name: { tr: 'Dar Geçitler', en: 'Narrow Passages' },
    desc: {
      tr: 'Katlar arasında yalnızca dar geçitlerle dolaşılır.',
      en: 'Floors linked only by narrow passages.',
    },
    build() {
      const g = makeGrid();
      border(g);
      const rows = [
        [5, [6, 28]],
        [10, [14, 34]],
        [15, [4, 22]],
        [20, [12, 31]],
      ];
      for (const [y, gaps] of rows) {
        fillRect(g, 1, y, 38, 1);
        for (const x of gaps) clearRect(g, x, y, 2, 1);
      }
      fillRect(g, 20, 6, 1, 4);
      fillRect(g, 27, 11, 1, 4);
      fillRect(g, 10, 16, 1, 4);
      return g;
    },
  },
];

// Dile göre harita metni ('tr', 'en-US', 'en-GB')
function mapText(index, field, lang) {
  const t = MAPS[index][field];
  if (lang === 'tr') return t.tr;
  if (lang === 'en-GB' && t.gb) return t.gb;
  return t.en;
}

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
    width: MAP_W,
    height: MAP_H,
    walls,
    spawns: def.spawns || DEFAULT_SPAWNS,
  };
}

if (typeof module !== 'undefined') module.exports = { MAPS, MAP_W, MAP_H, buildMap, mapText };
