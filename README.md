# RaufixBaba — Bio Sitesi

Yazılımcı bio sayfası. **HTML + CSS + JS** ile çalışır, **PHP** form işleyicisi opsiyonel olarak yanında gelir.
Arka planda animasyonlu kod yağmuru GIF'i, üstünde neon tema, rastgele şimşekler ve otomatik 8-bit müzik var.

> Canlı site (GitHub Pages): `https://realraufixbaba.github.io/My-Web-Page/`

## Özellikler

- 🎞️ **Animasyonlu GIF arka plan** — kod yağmuru + synthwave ızgara (`assets/img/bg-code-rain.gif`, 640×360, 12 fps, loop)
- ⚡ **Rastgele şimşekler** — SVG bolt çizimi + ekran flaşı + hafif shake + (müzik açıksa) gök gürültüsü. `L` tuşu veya footer'daki "şimşek çak" butonu ile manuel tetiklenir.
- 🎵 **Otomatik müzik** — `assets/audio/coder-theme.mp3` (8-bit chiptune, 132 BPM, 29 sn loop). Tarayıcılar sesli otomatik oynatmayı engellediği için ilk dokunuş/tuşta devreye girer; sağ alttaki player ile kontrol edilir.
- 🖥️ Terminal efekti, yazı yazma animasyonu, scroll reveal, yetenek barları, sayaçlar, kart tilt efekti, özel imleç ışığı.
- 📱 Responsive + `prefers-reduced-motion` desteği (hareket azaltma açıksa animasyonlar kapanır).
- ✉️ **PHP iletişim formu** (`php/contact.php`) — PHP hosting'de mail atar; GitHub Pages statik olduğu için form otomatik olarak GitHub issue akışına düşer.

## Klasör yapısı

```
index.html                 # ana bio sayfası
404.html                   # tema uyumlu hata sayfası
assets/css/style.css       # tüm stiller
assets/js/main.js          # müzik, şimşek, form, animasyonlar
assets/img/                # gif arka plan, avatar, poster, favicon
assets/audio/              # coder-theme.mp3
php/contact.php            # form işleyici (opsiyonel)
php/config.php             # mail adresleri ayarı
scripts/make_bg_gif.py     # arka plan GIF'ini yeniden üretir
scripts/make_music.py      # chiptune parçayı yeniden üretir
```

## Lokal çalıştırma

```bash
python3 -m http.server 8080
# http://localhost:8080
```

PHP'li denemek için:

```bash
php -S localhost:8080
```

## GitHub Pages'te yayınlama

1. Repository → **Settings → Pages**
2. **Source:** `Deploy from a branch`
3. **Branch:** yayınlamak istediğin dal (ör. `main`) + `/ (root)`
4. Kaydet. Birkaç dakika içinde site şu adreste olur:
   `https://realraufixbaba.github.io/My-Web-Page/`

> Not: Ücretsiz GitHub hesaplarında Pages yalnızca **public** repolarda yayınlanır.
> Repo private ise önce **Settings → General → Danger Zone → Change visibility → Public** yapılmalı
> (ya da GitHub Pro ile private repo Pages açılabilir).

## PHP formunu aktif etme

`php/config.php` içindeki `$MAIL_TO` ve `$MAIL_FROM` değerlerini kendi mail adresinle değiştir.
Siteyi PHP destekleyen bir sunucuya (paylaşımlı hosting, VPS vb.) attığında form doğrudan
`php/contact.php`'ye POST eder ve mail gönderir. GitHub Pages'te bu dosya çalışmaz; JS bunu
yakalar ve mesajı GitHub issue formuna dönüştürür.

## Varlıkları yeniden üretme

```bash
pip install pillow numpy lameenc
python3 scripts/make_bg_gif.py   # -> assets/img/bg-code-rain.gif
python3 scripts/make_music.py    # -> assets/audio/coder-theme.mp3
```

Müzik ve arka plan tamamen bu repodaki script'lerle üretildi — telif derdi yok.

## Kısayollar

| Tuş / buton | Etki |
| --- | --- |
| `L` | şimşek çaktır |
| Player ▶/❚❚ | müziği aç/kapat |
| Ses çubuğu | ses seviyesi |

---

© RaufixBaba — 7/24 kod modunda.
