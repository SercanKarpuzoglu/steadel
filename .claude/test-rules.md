# Steadel — test kuralları

`parsius-core:test-author` bu dosyayı **evrensel + `parsius-web:test-rules`
kurallarına ek olarak** uygular.

---

## Altyapı (mevcut)

- **Vitest** kurulu — `pnpm test` (`vitest run`), `pnpm test:watch`.
- **Playwright** kurulu — `pnpm test:e2e`, `e2e/` dizini.
- Yerel Postgres: `localhost:55432` (docker-compose).

Runner var; `parsius-web:test-rules`'un "önce altyapı kur" maddesi burada **N/A**.

## Org izolasyonu — zorunlu

Kapsam kontrolü **uygulama kodunda** (Drizzle `where` koşulu), veritabanında
değil. RLS yok. Yani izolasyonu doğrulayan tek şey testtir.

Kapsam-duyarlı her yeni sorgu/action için: **A organizasyonunun kaydı, B
organizasyonu bağlamında istendiğinde dönmemeli.** Özellikle `id` ile tekil
çekimlerde — `orgId` koşulu unutulmuşsa yalnız bu test yakalar.

## Webhook idempotency testi

Yeni webhook işleyicisi için: **aynı `(source, external_id)` ikinci kez
gelirse** iş mantığı tekrar çalışmamalı. Çift işleme para/veri hatası üretir.

Başarısız payload'ın `dead_letters`'a düştüğünü de doğrula.

## Worker / job testleri

`src/jobs/` altındaki iş mantığı worker sürecinden bağımsız test edilebilmeli —
job fonksiyonu saf tutulur, zamanlama/kuyruk dışarıda kalır.

## E2e kritik yol

Playwright ile para ve erişim yolları: kayıt/giriş → organizasyon → mağaza/ürün →
faturalama akışı. Her ekranı değil, kaybettiren yolu test et.

## Adlandırma

Test dosyası test ettiği modülün yanında (`*.test.ts`); e2e `e2e/` altında.
