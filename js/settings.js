'use strict';

// Renk anahtarları ve ayar yapısı değiştiği için yeni sürüm anahtarı kullanılır.
const STORAGE_KEY = 'webSnakeGame.settings.v2';

// Tüm renkler web güvenli paletten seçilir (her kanal 00, 33, 66, 99, CC veya FF).
const DEFAULT_COLORS = {
  background: '#000000',
  wall: '#CCCCCC',
  food: '#FFFF00',
  p1: '#00CC00', // 1. oyuncu: yeşil
  p2: '#FF9900', // 2. oyuncu: turuncu
  c1: '#3366FF', // 1. bilgisayar: mavi
  c2: '#CC33FF', // 2. bilgisayar: mor
};

const DEFAULT_SETTINGS = {
  sfx: true,
  music: true,
  volume: 0.6,
  // 'auto' = tarayıcı dilinden algıla; ya da 'tr', 'en-US', 'en-GB'
  language: 'auto',
  colors: { ...DEFAULT_COLORS },
  // Son kullanılan oyun yapılandırması
  game: {
    map: 0,
    humans: 1, // 1–2 insan oyuncu
    computers: 1, // 0–2 bilgisayar oyuncu
    difficulty: 'normal', // bilgisayarın ustalığı
    speed: 5, // 1 (yavaş) – 10 (çok hızlı)
    target: 30,
    foods: 5,
  },
};

// Bir rengi en yakın web güvenli renge yuvarlar.
function webSafe(hex) {
  const h = String(hex).replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (!/^[0-9a-f]{6}$/i.test(full) || Number.isNaN(n)) return '#000000';
  const snap = (v) => (Math.round(v / 51) * 51).toString(16).padStart(2, '0');
  return ('#' + snap((n >> 16) & 255) + snap((n >> 8) & 255) + snap(n & 255)).toUpperCase();
}

function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
}

function mergeInto(target, source) {
  for (const key of Object.keys(target)) {
    if (!(key in source)) continue;
    const t = target[key];
    const s = source[key];
    if (t && typeof t === 'object' && !Array.isArray(t)) {
      if (s && typeof s === 'object') mergeInto(t, s);
    } else if (typeof s === typeof t) {
      target[key] = s;
    }
  }
  return target;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

function loadSettings() {
  const settings = cloneDefaults();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) mergeInto(settings, JSON.parse(raw));
  } catch (e) {
    // Depolama kullanılamıyorsa varsayılanlarla devam et.
  }
  for (const k of Object.keys(settings.colors)) settings.colors[k] = webSafe(settings.colors[k]);
  const g = settings.game;
  g.humans = clamp(g.humans, 1, 2);
  g.computers = clamp(g.computers, 0, 2);
  g.speed = clamp(g.speed, 1, 10);
  g.target = clamp(g.target, 10, 100);
  g.foods = clamp(g.foods, 2, 10);
  if (!['easy', 'normal', 'hard'].includes(g.difficulty)) g.difficulty = 'normal';
  return settings;
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    // Yoksay
  }
}
