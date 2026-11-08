# Yılan Oyunu

Web tarayıcısında bir yılan oyunu

Telif Hakkı (c) 2026 Ercan Ersoy

Bu yazılım MIT Lisansı ile lisanslanmıştır.

Claude Code Opus 5.5 yardımı ile yapılmıştır.

HTML5 Canvas ile yazılmış, web tabanlı iki boyutlu yılan oyunu. Kurulum gerektirmez: `index.html` dosyasını tarayıcıda açmanız yeterli.

## Özellikler

- Tam pencereyi kaplayan canvas oyun alanı
- Ana menü: **Oyuna Başla**, **Ayarlar**, **Hakkında**
- Oyun yapılandırması: harita (25 adet), 1–2 insan ve 0–2 bilgisayar oyuncu (en fazla 4 yılan), bilgisayarın zorluk seviyesi (Kolay / Orta / Zor), yılan hızı (1–10), hedef puan (10–100), aynı anda yem sayısı (2–10)
- Yeşil oyuncu yılanı, mavi rakip yılan (2. oyuncu turuncu, 2. bilgisayar mor), sarı yemler, açık gri duvarlar, siyah arka plan
- Yalnızca web güvenli renkler kullanılır; ayarlardaki renk seçici 216 renklik web güvenli paleti gösterir
- Ayarlar: dil, ses efektleri ve müzik aç/kapa, ses düzeyi ve tüm renkler (tarayıcıda saklanır)
- Dil seçenekleri: Türkiye Türkçesi, Amerikan İngilizcesi, İngiliz İngilizcesi. İlk açılışta tarayıcı dilinden otomatik algılanır; Türkçe ve İngilizce dışındaki dillerde Amerikan İngilizcesi kullanılır.
- Web Audio API ile üretilen ses efektleri ve arka plan müziği (ses dosyası yok)
- Klavye ve dokunmatik (kaydırma) desteği

## Kurallar

- Her yem 1 puan kazandırır ve yılanı uzatır. Hedef puana ilk ulaşan kazanır.
- Duvara çarpan veya harita dışına çıkan yılan elenir, onu kontrol eden kaybeder.
- Kendine veya başka bir yılana çarpan da elenir. Ayakta kalan son yılan kazanır; son yılanlar birlikte elenirse berabere biter.
- Bütün insan oyuncular elenirse bilgisayarlar kazanır.

## Kontroller

| Tuş | İşlev |
| --- | --- |
| Ok tuşları / WASD | Yön (tek oyuncu) |
| WASD | 1. oyuncunun yönü (iki oyuncu) |
| Ok tuşları | 2. oyuncunun yönü (iki oyuncu) |
| P / Esc | Duraklat / devam et |
| Parmağı kaydırma | Yön (dokunmatik) |

## Dosyalar

- `index.html` – sayfa ve menüler
- `css/style.css` – arayüz stilleri
- `js/i18n.js` – dil dosyaları ve tarayıcı dili algılama
- `js/maps.js` – 25 harita
- `js/game.js` – oyun kuralları ve bilgisayar yılanının yapay zekâsı
- `js/render.js` – canvas çizimi
- `js/audio.js` – ses efektleri ve müzik
- `js/settings.js` – ayarların saklanması
- `js/main.js` – menüler, giriş ve ana döngü
