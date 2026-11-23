# Sohbet kurulumu (Supabase)

Site statik; sohbetin çalışması için tek seferlik bir Supabase kurulumu gerekiyor. Yaklaşık 5 dakika.

## 1. Proje aç
1. https://supabase.com → giriş yap → **New project**
2. İsim: `raufixbaba-sohbet`, bölge olarak Frankfurt seçilebilir, şifreyi bir yere yaz.
3. Proje açılınca **Project Settings → API** sayfasına git.

Buradan iki değer gerekiyor:
- **Project URL** (`https://xxxx.supabase.co`)
- **anon public** anahtarı

`service_role` anahtarını **hiçbir yere koyma**, o sunucu içindir. Sitenin koduna sadece `anon` girer.

## 2. Anonim girişi aç
**Authentication → Providers → Email** bölümünde **Anonymous sign-ins** seçeneğini aç ve kaydet.
Bu olmadan sohbet "yazma izni yok" der; çünkü kullanıcı başına hız limitini anonim kimliğe bağlıyoruz.

## 3. Tabloyu ve korumayı kur
**SQL Editor → New query** aç, kökteki `supabase-setup.sql` dosyasının tamamını yapıştır ve **Run** de.

Bu dosya şunları kurar:
- `messages` tablosu (id, user_id, name, body, created_at, ip)
- Satır bazlı güvenlik: herkes okur, sadece giriş yapmış kullanıcı kendi adına yazar, güncelleme/silme kapalı
- `chat_guard` tetikleyicisi: 9 saniye bekleme, dakikada 5 mesaj, aynı mesajı 5 dakika içinde tekrar gönderme yasağı, mesaj başına 1 link, 10+ tekrar eden karakter spam filtresi, kontrol karakterlerinin temizlenmesi, aynı IP'den dakikada 8 mesaj sınırı

## 4. Anahtarları siteye yaz
`assets/js/config.js` dosyasını aç:

```js
window.RB_CHAT = {
  url: "https://xxxx.supabase.co",
  anonKey: "eyJhbGciOi...",
  table: "messages"
};
```

## 5. Yayına al
`node scripts/build.mjs` → `docs/` güncellenir → commit + push → Pages 1 dakikada kendini yeniler.

## 6. Dene
İki farklı tarayıcı (veya normal + gizli sekme) aç, iki taraftan mesaj yaz. 9 saniye içinde ikinci mesajı denersen "çok hızlı" uyarısı gelmeli.

## Ne engelleniyor, ne engellenmiyor
- **Engellenen:** flood, tekrar mesaj, link spam, çok hızlı gönderim, isimle link, kontrol karakteri, tek IP'den toplu gönderim, isimsiz yazma.
- **Kısmen engellenen:** basit botlar (kontrol sorusu + anonim kimlik). Kararlı bir bot, insan gibi davranarak yazabilir.
- **Sonra eklenebilir:** Cloudflare Turnstile (gerçek captcha) ve mesaj başına server-side içerik filtresi. İkisi de Supabase Edge Function ile yapılır; istersen sonraki turda ekleriz.
