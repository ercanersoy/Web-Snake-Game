'use strict';

// Desteklenen diller: Türkiye Türkçesi, Amerikan İngilizcesi, İngiliz İngilizcesi
const LANGUAGES = ['tr', 'en-US', 'en-GB'];

const ABOUT_EN = (o) => `
<p>A web-based, two-dimensional take on the classic snake game. You steer the green snake; a second player can join with the orange snake. Up to two computer snakes (blue and purple) can race against you.</p>
<h3>Rules</h3>
<ul>
  <li>Eat the yellow food: each piece is worth <b>1 point</b> and makes your snake longer.</li>
  <li>The first snake to reach the target score (10–100) <b>wins</b>.</li>
  <li>A snake that hits a wall or leaves the map is <b>knocked out</b>, and its player loses.</li>
  <li>Running into yourself or another snake also knocks you out. The last snake standing wins; if the last snakes go out together, it's a ${o.draw}.</li>
  <li>If every human player is knocked out, the computers win.</li>
</ul>
<h3>Controls</h3>
<ul>
  <li>One player: <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> or <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd></li>
  <li>Two players: Player 1 <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>, Player 2 <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd></li>
  <li><kbd>P</kbd> or <kbd>Esc</kbd>: pause / resume</li>
  <li>On a touch screen: swipe (Player 1)</li>
</ul>
<p class="muted">25 maps · up to 4 snakes · adjustable speed · web-safe ${o.colors} · sounds generated with Web Audio · HTML5 Canvas</p>
<div class="credits">
  <p><b>A snake game in the web browser</b></p>
  <p>Copyright (c) 2026 Ercan Ersoy</p>
  <p>This software is licensed under the MIT License.</p>
  <p>Made with the help of Claude Code Opus 5.5.</p>
</div>`;

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
    'setup.humans': 'İnsan oyuncu',
    'setup.computers': 'Bilgisayar oyuncu',
    'setup.difficulty': 'Bilgisayarın zorluk seviyesi',
    'setup.speed': 'Yılan hızı:',
    'setup.target': 'Kazanmak için gereken puan:',
    'setup.foods': 'Aynı anda yem sayısı:',
    'setup.start': 'Başlat',
    'setup.controls1': 'Kontroller: ok tuşları veya W A S D',
    'setup.controls2': 'Oyuncu 1: W A S D · Oyuncu 2: ok tuşları',
    'speed.1': 'çok yavaş',
    'speed.2': 'yavaş',
    'speed.3': 'orta',
    'speed.4': 'hızlı',
    'speed.5': 'çok hızlı',
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
    'settings.colorsNote': 'Yalnızca web güvenli renkler kullanılır.',
    'settings.pick': 'Renk seç: {name}',
    'settings.reset': 'Varsayılana dön',
    'lang.auto': 'Otomatik (tarayıcı dili)',
    'color.p1': 'Oyuncu 1',
    'color.p2': 'Oyuncu 2',
    'color.c1': 'Bilgisayar 1',
    'color.c2': 'Bilgisayar 2',
    'color.food': 'Yem',
    'color.wall': 'Duvar',
    'color.background': 'Arka plan',
    'about.title': 'Hakkında',
    'about.body': `
<p>Klasik yılan oyununun web tabanlı, iki boyutlu bir yorumu. Yeşil yılanı sen yönetirsin; ikinci bir oyuncu turuncu yılanla katılabilir. En fazla iki bilgisayar yılanı (mavi ve mor) size rakip olabilir.</p>
<h3>Kurallar</h3>
<ul>
  <li>Sarı yemleri ye: her yem <b>1 puan</b> kazandırır ve yılanı uzatır.</li>
  <li>Belirlenen hedef puana (10–100) ilk ulaşan <b>kazanır</b>.</li>
  <li>Duvara çarpan ya da harita dışına çıkan yılan <b>elenir</b>, onu kontrol eden kaybeder.</li>
  <li>Kendine veya başka bir yılana çarpan da elenir. Ayakta kalan son yılan kazanır; son yılanlar birlikte elenirse oyun berabere biter.</li>
  <li>Bütün insan oyuncular elenirse bilgisayarlar kazanır.</li>
</ul>
<h3>Kontroller</h3>
<ul>
  <li>Tek oyuncu: <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> veya <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd></li>
  <li>İki oyuncu: Oyuncu 1 <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>, Oyuncu 2 <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd></li>
  <li><kbd>P</kbd> veya <kbd>Esc</kbd>: duraklat / devam et</li>
  <li>Dokunmatik ekranda: parmağını kaydır (Oyuncu 1)</li>
</ul>
<p class="muted">25 harita · en fazla 4 yılan · ayarlanabilir hız · web güvenli renkler · Web Audio ile üretilen sesler · HTML5 Canvas</p>
<div class="credits">
  <p><b>Web tarayıcısında bir yılan oyunu</b></p>
  <p>Telif Hakkı (c) 2026 Ercan Ersoy</p>
  <p>Bu yazılım MIT Lisansı ile lisanslanmıştır.</p>
  <p>Claude Code Opus 5.5 yardımı ile yapılmıştır.</p>
</div>`,
    'pause.title': 'Duraklatıldı',
    'pause.button': 'Duraklat (P / Esc)',
    'pause.resume': 'Devam Et',
    'pause.restart': 'Yeniden Başla',
    'pause.mainMenu': 'Ana Menü',
    'over.again': 'Tekrar Oyna',
    'over.change': 'Yapılandırmayı Değiştir',
    'name.you': 'Sen',
    'name.player': 'Oyuncu {n}',
    'name.playerShort': 'O{n}',
    'name.cpu': 'Bilgisayar',
    'name.cpuShort': 'Bilg.',
    'name.cpuN': 'Bilgisayar {n}',
    'name.cpuNShort': 'B{n}',
    'countdown.go': 'BAŞLA!',
    'result.win': 'Kazandın!',
    'result.lose': 'Kaybettin',
    'result.draw': 'Berabere!',
    'result.wins': '{name} kazandı!',
    'result.cpusWin': 'Bilgisayarlar kazandı!',
    'reason.target': 'Hedef puana ({target}) ulaşıldı.',
    'reason.solo': 'Yılanın {death}.',
    'reason.last': 'Ayakta kalan son yılan kazandı.',
    'reason.humansOut': 'Bütün insan oyuncular elendi.',
    'reason.allOut': 'Kalan yılanların hepsi aynı anda elendi.',
    'death.wall': 'duvara çarptı',
    'death.out': 'harita dışına çıktı',
    'death.self': 'kendine çarptı',
    'death.snake': 'başka bir yılana çarptı',
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
  'setup.humans': 'Human players',
  'setup.computers': 'Computer players',
  'setup.difficulty': 'Computer difficulty',
  'setup.speed': 'Snake speed:',
  'setup.target': 'Points needed to win:',
  'setup.foods': 'Food on the board at once:',
  'setup.start': 'Start',
  'setup.controls1': 'Controls: arrow keys or W A S D',
  'setup.controls2': 'Player 1: W A S D · Player 2: arrow keys',
  'speed.1': 'very slow',
  'speed.2': 'slow',
  'speed.3': 'medium',
  'speed.4': 'fast',
  'speed.5': 'very fast',
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
  'settings.colorsNote': 'Only web-safe colors are used.',
  'settings.pick': 'Pick a color: {name}',
  'settings.reset': 'Reset to defaults',
  'lang.auto': 'Automatic (browser language)',
  'color.p1': 'Player 1',
  'color.p2': 'Player 2',
  'color.c1': 'Computer 1',
  'color.c2': 'Computer 2',
  'color.food': 'Food',
  'color.wall': 'Walls',
  'color.background': 'Background',
  'about.title': 'About',
  'about.body': ABOUT_EN({ draw: 'tie', colors: 'colors' }),
  'pause.title': 'Paused',
  'pause.button': 'Pause (P / Esc)',
  'pause.resume': 'Resume',
  'pause.restart': 'Restart',
  'pause.mainMenu': 'Main Menu',
  'over.again': 'Play Again',
  'over.change': 'Change Setup',
  'name.you': 'You',
  'name.player': 'Player {n}',
  'name.playerShort': 'P{n}',
  'name.cpu': 'Computer',
  'name.cpuShort': 'CPU',
  'name.cpuN': 'Computer {n}',
  'name.cpuNShort': 'C{n}',
  'countdown.go': 'GO!',
  'result.win': 'You win!',
  'result.lose': 'You lose',
  'result.draw': "It's a tie!",
  'result.wins': '{name} wins!',
  'result.cpusWin': 'The computers win!',
  'reason.target': 'The target score of {target} was reached.',
  'reason.solo': 'Your snake {death}.',
  'reason.last': 'The last snake standing wins.',
  'reason.humansOut': 'Every human player is out.',
  'reason.allOut': 'The remaining snakes were all knocked out at once.',
  'death.wall': 'hit a wall',
  'death.out': 'left the map',
  'death.self': 'ran into itself',
  'death.snake': 'ran into another snake',
  'death.head': 'collided head-on',
};

STRINGS['en-GB'] = {
  ...STRINGS['en-US'],
  'settings.colors': 'Colours',
  'settings.colorsNote': 'Only web-safe colours are used.',
  'settings.pick': 'Pick a colour: {name}',
  'settings.reset': 'Restore defaults',
  'about.body': ABOUT_EN({ draw: 'draw', colors: 'colours' }),
  'result.lose': 'You lost',
  'result.draw': "It's a draw!",
};

// Tarayıcı dilinden en uygun dili seçer.
function detectLanguage() {
  const list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en-US'])
    .map((l) => String(l).toLowerCase());
  for (const l of list) {
    if (l === 'tr' || l.startsWith('tr-')) return 'tr';
    if (l === 'en' || l === 'en-us') return 'en-US';
    // ABD dışındaki İngilizce bölgeleri (en-GB, en-AU, en-IE…) İngiliz yazımını kullanır.
    if (l.startsWith('en-')) return 'en-GB';
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
