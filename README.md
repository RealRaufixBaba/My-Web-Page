# RaufixBaba — Bio

Yazılım geliştirici bio sayfası. **HTML + CSS + JS** ile çalışır; **PHP** form işleyicisi yanında gelir.
Olgun, modern ve dark bir düzen: serif başlıklar, ince çizgiler, düşük doygunluklu hacker GIF'leri,
piksel emoji GIF'leri, otomatik şimşekler ve lo-fi müzik.

> Canlı site: `https://realraufixbaba.github.io/My-Web-Page/`

## İçerik

- **Hikâye** — metin, görünür olduğunda ekranda yazılarak akar (atlanabilir)
- **İşler** — Android, web/backend, Minecraft modlama
- **Yetenekler** — düz yetenek çizgileri + araç listesi + radar GIF paneli
- **Yolculuk** — 2022 → 2026
- **İletişim** — PHP mail formu; statik hosting'de otomatik GitHub issue taslağına düşer

## Görsel / işitsel varlıklar

Hepsi bu repodaki Python script'leriyle üretildi — telif sorunu yok.

| Dosya | Ne | Üreten |
| --- | --- | --- |
| `assets/img/bg-code-rain.gif` | 640×360, 48 kare, düşük doygunluklu kod yağmuru | `scripts/make_bg_gif.py` |
| `assets/img/terminal.gif` | 460×258, satır satır yazılan terminal | `scripts/make_gifs.py` |
| `assets/img/radar.gif` | 300×300, taramalı radar paneli | `scripts/make_gifs.py` |
| `assets/img/emoji/*.gif` | 6 piksel emoji (cursor, coffee, bolt, keyboard, chip, bug) | `scripts/make_emojis.py` |
| `assets/audio/night-build.mp3` | 48 sn lo-fi, 80 BPM, Am9–Fmaj7–Cmaj7–G6 | `scripts/make_music.py` |
| `assets/img/portrait.jpg` | portre görseli | AI ile üretildi |

Yeniden üretmek için:

```bash
pip install pillow numpy lameenc
python3 scripts/make_bg_gif.py
python3 scripts/make_gifs.py
python3 scripts/make_emojis.py
python3 scripts/make_music.py
```

## Müzik ve şimşek davranışı

- Tarayıcılar sesli otomatik oynatmayı engeller. Sayfa müziği otomatik başlatmayı dener; engellenirse
  ilk dokunuş/tuş/tıklamada başlar. Sağ alttaki oynatıcıdan kontrol edilir.
- Şimşek 7–16 saniye aralığında otomatik çakar; `L` tuşu ya da footer'daki “şimşek çak” butonuyla
  elle tetiklenebilir. `prefers-reduced-motion` açıksa otomatik şimşek kapanır.

## Lokal çalıştırma

```bash
python3 -m http.server 8080     # http://localhost:8080
php -S localhost:8080           # PHP formunu denemek için
```

## GitHub Pages'te yayınlama

1. Repository → **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` · klasör: `/ (root)`
4. Kaydet → `https://realraufixbaba.github.io/My-Web-Page/`

> Ücretsiz GitHub hesaplarında Pages yalnızca **public** repolarda yayınlanır.
> Private repo + ücretsiz Pages mümkün değil; private kalmak istiyorsan GitHub Pro ya da
> Cloudflare Pages / Netlify gibi bir host gerekir.

## PHP formu

`php/config.php` içindeki `$MAIL_TO` ve `$MAIL_FROM` değerlerini kendi adreslerinle değiştir.
PHP destekleyen bir sunucuda form doğrudan `php/contact.php`'ye POST eder; GitHub Pages'te
JS bu durumu yakalar ve mesajı GitHub issue taslağına dönüştürür.

## Kısayollar

| Tuş / buton | Etki |
| --- | --- |
| `L` | şimşek çaktır |
| ▶ / ❚❚ | müziği aç / kapat |
| `Esc` | mobil menüyü / ses ipucunu kapat |

---

© RaufixBaba — İstanbul · build → ship → repeat
