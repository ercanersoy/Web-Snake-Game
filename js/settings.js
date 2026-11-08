'use strict';

const STORAGE_KEY = 'webSnakeGame.settings.v1';

const DEFAULT_COLORS = {
  background: '#000000',
  wall: '#c0c0c0',
  player: '#2f7dff',
  ai: '#ff2e2e',
  food: '#ffd400',
};

const DEFAULT_SETTINGS = {
  sfx: true,
  music: true,
  volume: 0.6,
  showGrid: true,
  colors: { ...DEFAULT_COLORS },
  // Son kullanılan oyun yapılandırması
  game: {
    map: 0,
    difficulty: 'normal',
    opponent: true,
    target: 30,
    foods: 5,
  },
};

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

function loadSettings() {
  const settings = cloneDefaults();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) mergeInto(settings, JSON.parse(raw));
  } catch (e) {
    // Depolama kullanılamıyorsa varsayılanlarla devam et.
  }
  return settings;
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    // Yoksay
  }
}
