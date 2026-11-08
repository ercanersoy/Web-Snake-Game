'use strict';

// Desteklenen diller: Türkiye Türkçesi, Amerikan İngilizcesi, İngiliz İngilizcesi
const LANGUAGES = ['tr', 'en-US', 'en-GB'];

const ABOUT_EN = (o) => `
<p>A web-based, two-dimensional take on the classic snake game. You steer the blue snake and, if you like, race against the red computer snake.</p>
<h3>Rules</h3>
<ul>
  <li>Eat the yellow food: each piece is worth <b>1 point</b> and makes your snake longer.</li>
  <li>The first snake to reach the target score (10–100) <b>wins</b>.</li>
  <li>If your snake hits a wall or leaves the map, you <b>lose</b>.</li>
  <li>Running into yourself or the other snake also loses. A head-on collision ends in a ${o.draw}.</li>
</ul>
<h3>Controls</h3>
<ul>
  <li><kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> or <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>: steer</li>
  <li><kbd>P</kbd> or <kbd>Esc</kbd>: pause / resume</li>
  <li>On a touch screen: swipe</li>
</ul>
<p class="muted">25 maps · 3 difficulty levels · sounds generated with Web Audio · HTML5 Canvas</p>`;

const STRINGS = {
  tr: {
    'doc.title': 'Yılan Oyunu',
    'logo.a': 'Yılan',
    'logo.b': 'Oyunu',
    'subtitle': 'Yemleri topla, hedef puana ilk sen ulaş!',
    'menu.start': 'Oyuna Başla',
    'menu.settings': 'Ayarlar',
    'menu.about': 'Hakkında',
    'common.back': 'Geri',
    'common.ok': 'Tamam',
    'setup.title': 'Oyun Yapılandırması',
    'setup.map': 'Harita',
    'setup.prevMap': 'Önceki harita',
    'setup.nextMap': 'Sonraki harita',
    'setup.difficulty': 'Zorluk seviyesi',
    'setup.opponent': 'Rakip yılan',
    'setup.none': 'Yok (tek yılan)',
    'setup.computer': 'Bilgisayar',
    'setup.target': 'Kazanmak için gereken puan:',
    'setup.foods': 'Aynı anda yem sayısı:',
    'setup.start': 'Başlat',
    'diff.easy': 'Kolay',
    'diff.normal': 'Orta',
    'diff.hard': 'Zor',
    'settings.title': 'Ayarlar',
    'settings.language': 'Dil',
    'settings.sfx': 'Ses efektleri',
    'settings.music': 'Müzik',
    'settings.volume': 'Ses düzeyi:',
    'settings.volumeValue': '%{n}',
    'settings.colors': 'Renkler',
    'settings.reset': 'Varsayılana dön',
    'lang.auto': 'Otomatik (tarayıcı dili)',
    'color.player': 'Oyuncu yılanı',
    'color.ai': 'Bilgisayar yılanı',
    'color.food': 'Yem',
    'color.wall': 'Duvar',
    'color.background': 'Arka plan',
    'about.title': 'Hakkında',
    'about.body': `
<p>Klasik yılan oyununun web tabanlı, iki boyutlu bir yorumu. Mavi yılanı sen yönetirsin; istersen kırmızı bilgisayar yılanına karşı yarışırsın.</p>
<h3>Kurallar</h3>
<ul>
  <li>Sarı yemleri ye: her yem <b>1 puan</b> kazandırır ve yılanı uzatır.</li>
  <li>Belirlenen hedef puana (10–100) ilk ulaşan <b>kazanır</b>.</li>
  <li>Duvara çarpan ya da harita dışına çıkan yılanın sahibi <b>kaybeder</b>.</li>
  <li>Kendine veya diğer yılana çarpan da kaybeder. Kafa kafaya çarpışma berabere biter.</li>
</ul>
<h3>Kontroller</h3>
<ul>
  <li><kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> veya <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>: yön</li>
  <li><kbd>P</kbd> veya <kbd>Esc</kbd>: duraklat / devam et</li>
  <li>Dokunmatik ekranda: parmağını kaydır</li>
</ul>
<p class="muted">25 harita · 3 zorluk seviyesi · Web Audio ile üretilen sesler · HTML5 Canvas</p>`,
    'pause.title': 'Duraklatıldı',
    'pause.button': 'Duraklat (P / Esc)',
    'pause.resume': 'Devam Et',
    'pause.restart': 'Yeniden Başla',
    'pause.mainMenu': 'Ana Menü',
    'over.again': 'Tekrar Oyna',
    'over.change': 'Yapılandırmayı Değiştir',
    'hud.you': 'Sen',
    'hud.computer': 'Bilgisayar',
    'hud.computerShort': 'Bilg.',
    'countdown.go': 'BAŞLA!',
    'result.win': 'Kazandın! 🎉',
    'result.lose': 'Kaybettin',
    'result.draw': 'Berabere!',
    'reason.youFirst': '{target} puana ilk sen ulaştın.',
    'reason.aiDied': 'Bilgisayar yılanı {death}.',
    'reason.bothTarget': 'İki yılan da hedef puana aynı anda ulaştı.',
    'reason.headOn': 'Yılanlar kafa kafaya çarpıştı.',
    'reason.bothDied': 'İki yılan da aynı anda elendi.',
    'reason.aiFirst': 'Bilgisayar {target} puana senden önce ulaştı.',
    'reason.youDied': 'Yılanın {death}.',
    'death.wall': 'duvara çarptı',
    'death.out': 'harita dışına çıktı',
    'death.self': 'kendine çarptı',
    'death.snake': 'diğer yılana çarptı',
    'death.head': 'kafa kafaya çarpıştı',
  },
};

STRINGS['en-US'] = {
  'doc.title': 'Snake Game',
  'logo.a': 'Snake',
  'logo.b': 'Game',
  'subtitle': 'Collect the food and be the first to reach the target score!',
  'menu.start': 'Start Game',
  'menu.settings': 'Settings',
  'menu.about': 'About',
  'common.back': 'Back',
  'common.ok': 'OK',
  'setup.title': 'Game Setup',
  'setup.map': 'Map',
  'setup.prevMap': 'Previous map',
  'setup.nextMap': 'Next map',
  'setup.difficulty': 'Difficulty',
  'setup.opponent': 'Opponent snake',
  'setup.none': 'None (solo)',
  'setup.computer': 'Computer',
  'setup.target': 'Points needed to win:',
  'setup.foods': 'Food on the board at once:',
  'setup.start': 'Start',
  'diff.easy': 'Easy',
  'diff.normal': 'Medium',
  'diff.hard': 'Hard',
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.sfx': 'Sound effects',
  'settings.music': 'Music',
  'settings.volume': 'Volume:',
  'settings.volumeValue': '{n}%',
  'settings.colors': 'Colors',
  'settings.reset': 'Reset to defaults',
  'lang.auto': 'Automatic (browser language)',
  'color.player': 'Player snake',
  'color.ai': 'Computer snake',
  'color.food': 'Food',
  'color.wall': 'Walls',
  'color.background': 'Background',
  'about.title': 'About',
  'about.body': ABOUT_EN({ draw: 'tie' }),
  'pause.title': 'Paused',
  'pause.button': 'Pause (P / Esc)',
  'pause.resume': 'Resume',
  'pause.restart': 'Restart',
  'pause.mainMenu': 'Main Menu',
  'over.again': 'Play Again',
  'over.change': 'Change Setup',
  'hud.you': 'You',
  'hud.computer': 'Computer',
  'hud.computerShort': 'CPU',
  'countdown.go': 'GO!',
  'result.win': 'You win! 🎉',
  'result.lose': 'You lose',
  'result.draw': "It's a tie!",
  'reason.youFirst': 'You reached {target} points first.',
  'reason.aiDied': 'The computer snake {death}.',
  'reason.bothTarget': 'Both snakes reached the target score at the same time.',
  'reason.headOn': 'The snakes collided head-on.',
  'reason.bothDied': 'Both snakes were knocked out at the same time.',
  'reason.aiFirst': 'The computer reached {target} points before you.',
  'reason.youDied': 'Your snake {death}.',
  'death.wall': 'hit a wall',
  'death.out': 'left the map',
  'death.self': 'ran into itself',
  'death.snake': 'ran into the other snake',
  'death.head': 'collided head-on',
};

STRINGS['en-GB'] = {
  ...STRINGS['en-US'],
  'settings.colors': 'Colours',
  'settings.reset': 'Restore defaults',
  'about.body': ABOUT_EN({ draw: 'draw' }),
  'result.lose': 'You lost',
  'result.draw': "It's a draw!",
};

// Tarayıcı dilinden en uygun dili seçer.
function detectLanguage() {
  const list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en-US'])
    .map((l) => String(l).toLowerCase());
  for (const l of list) {
    if (l === 'tr' || l.startsWith('tr-')) return 'tr';
    if (l === 'en-us') return 'en-US';
    // ABD dışındaki İngilizce bölgeleri (en-GB, en-AU, en-IE…) İngiliz yazımını kullanır.
    if (l.startsWith('en-')) return 'en-GB';
    if (l === 'en') return 'en-US';
  }
  return 'en-US';
}

const I18n = {
  lang: 'tr',

  set(choice) {
    this.lang = LANGUAGES.includes(choice) ? choice : detectLanguage();
    document.documentElement.lang = this.lang;
    document.title = t('doc.title');
    document.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
    document.querySelectorAll('[data-i18n-html]').forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
    document.querySelectorAll('[data-i18n-label]').forEach((el) => {
      const text = t(el.dataset.i18nLabel);
      el.setAttribute('aria-label', text);
      el.setAttribute('title', text);
    });
  },
};

function t(key, params) {
  const table = STRINGS[I18n.lang] || STRINGS['en-US'];
  let s = key in table ? table[key] : STRINGS['en-US'][key] || key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.replace(`{${k}}`, v);
  return s;
}
