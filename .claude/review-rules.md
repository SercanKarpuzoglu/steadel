# Steadel — inceleme kuralları

`parsius-core:code-reviewer` bu dosyayı **evrensel + `parsius-web:review-rules`
kurallarına ek olarak** uygular.

---

### 1. Org kapsamı her sorguda — Drizzle korumaz

Kapsam kolonu **`orgId`**, değeri oturumdaki organizasyondan gelir. Drizzle
otomatik filtre uygulamaz.

```ts
// ✅ tekil çekim — id TEK BAŞINA yetmez
where: and(eq(stores.id, storeId), eq(stores.orgId, org.id))
// ❌ başka org'un kaydını döndürür
where: eq(stores.id, storeId)
```

Yeni/değişen her sorguda `orgId` koşulunu ara. *Emsal: `stores/actions.ts:28`.*

### 2. Deploy kalıbı — `up -d --build` yasak

`docker compose up -d --build` **prod'u iki kez düşürdü**. Deploy yalnız
`/opt/steadel/deploy.sh` ile: `git pull` → `build` (konteynerler çalışmaya devam
eder) → `up -d --no-build` → sağlık kontrolü.

Deploy dokümanı veya script'i değişiyorsa bu sıra korunuyor mu kontrol et.
`DECISIONS.md` M0/5 hâlâ eski kalıbı tarif ediyor — güncellenmesi gereken bir
tutarsızlık.

### 3. Webhook idempotency

Dış webhook işleyen kod, `processed_webhooks` tablosundaki
**`(source, external_id)` unique index'ine insert** ederek idempotency sağlar —
insert'in kendisi kontroldür. Başarısız payload'lar `dead_letters`'a düşer
(admin retry).

Yeni webhook işleyici bu kalıba uyuyor mu? Uymayan işleyici **çift işleme**
üretir.

### 4. Migration'lar deploy'da otomatik uygulanır

Tek seferlik `migrate` compose servisi `pnpm db:migrate`'i `app`/`worker`'dan
**önce** koşar. Yani migration elle çalıştırılmaz; ama **geri alınamaz bir
migration** deploy'u kilitleyebilir.

Yeni migration yıkıcı adım içeriyorsa (kolon/tablo silme, tip daraltma, mevcut
veriye NOT NULL) önce uyar, etkilenen veriyi anlat, rollback stratejisini belirt.

### 5. Auth.js sınırları

- Oturum **JWT (cookie)**, veritabanı adapter'ı yok.
- Magic link = kendi `auth_tokens` tablomuzda **tek kullanımlık** token, ikinci
  bir Credentials provider ile bozdurulur. Token yeniden kullanılabilir hale
  gelmemeli.
- Parola hash'i **Argon2id** (`@node-rs/argon2`). Başka bir algoritma eklenmemeli.

### 6. Karar günlüğü

SPEC'in kapsamadığı bir teknik seçim yapıldıysa (kütüphane, strateji, kalıp)
**`DECISIONS.md`'ye tek paragraf** eklenir: ne seçildi ve neden. Prensip: *en basit
çalışan seçeneği seç ve belgele.*

Bu turda böyle bir seçim yapıldıysa günlük güncellendi mi?
