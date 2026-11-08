# Yılan Oyunu

HTML5 Canvas ile yazılmış, web tabanlı iki boyutlu yılan oyunu. Kurulum gerektirmez: `index.html` dosyasını tarayıcıda açmanız yeterli.

## Özellikler

- Tam pencereyi kaplayan canvas oyun alanı
- Ana menü: **Oyuna Başla**, **Ayarlar**, **Hakkında**
- Oyun yapılandırması: harita (25 adet), zorluk (Kolay / Orta / Zor), bilgisayar rakibi var/yok, hedef puan (10–100), aynı anda yem sayısı (2–10)
- Mavi oyuncu yılanı, kırmızı bilgisayar yılanı, sarı yemler, açık gri duvarlar, siyah arka plan
- Ayarlar: dil, ses efektleri ve müzik aç/kapa, ses düzeyi ve tüm renkler (tarayıcıda saklanır)
- Dil seçenekleri: Türkiye Türkçesi, Amerikan İngilizcesi, İngiliz İngilizcesi. İlk açılışta tarayıcı dilinden otomatik algılanır; Türkçe ve İngilizce dışındaki dillerde Amerikan İngilizcesi kullanılır.
- Web Audio API ile üretilen ses efektleri ve arka plan müziği (ses dosyası yok)
- Klavye ve dokunmatik (kaydırma) desteği

## Kurallar

- Her yem 1 puan kazandırır ve yılanı uzatır. Hedef puana ilk ulaşan kazanır.
- Duvara çarpan veya harita dışına çıkan yılanın sahibi kaybeder.
- Kendine veya diğer yılana çarpan da kaybeder; kafa kafaya çarpışma berabere biter.

## Kontroller

| Tuş | İşlev |
| --- | --- |
| Ok tuşları / WASD | Yön |
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
