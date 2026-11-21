# RaufixBaba — Bio

Kişisel bio sitesi. **HTML + CSS + JS** (statik), yanında opsiyonel **PHP** form işleyicisi.

Yayın adresi: **https://realraufixbaba.github.io**

## Yapı

```
index.html               ana sayfa
404.html                 hata sayfası
assets/css/style.css     stiller
assets/js/main.js        etkileşimler (müzik, şimşek, hikâye yazımı, form)
assets/img/              portre, GIF panelleri, piksel emojiler, favicon
assets/audio/            night-build.mp3
php/                     form işleyicisi (opsiyonel)
scripts/                 varlık üreticileri ve build
dist/                    minify + obfuscate edilmiş yayın sürümü (git'e girmez)
```

## Geliştirme

```
npm install
npm run serve          # http://localhost:8080 (python http.server)
npm run build          # dist/ üretir: minify + obfuscate
npm test               # dist'i jsdom ile duman testinden geçirir
```

PHP'li deneme: `php -S localhost:8080`

## Yayın

`dist/` içeriği, `RealRaufixBaba.github.io` reposunun `main` dalına gönderilir;
GitHub Pages kök adresten yayınlar. Yayın reposunda yalnızca üretim dosyaları bulunur,
kaynak repo (bu repo) gizlidir.

## Varlıklar

`assets/img` ve `assets/audio` altındaki GIF ve müzik dosyaları `scripts/` içindeki
Python script'leriyle üretilir. Yeniden üretmek için:

```
pip install pillow numpy lameenc
python3 scripts/make_bg_gif.py
python3 scripts/make_gifs.py
python3 scripts/make_emojis.py
python3 scripts/make_music.py
```

## Notlar

- Sesli otomatik oynatma tarayıcıda engellenir; müzik ilk dokunuşta başlar.
- Şimşek otomatik çakar, `L` tuşu ile manuel tetiklenir.
- `prefers-reduced-motion` açıksa animasyonlar kapanır.
