<!-- parsius-profile v1 -->

# Steadel — Parsius proje profili

**Boş alan tahmin edilmez** — alanı isteyen bileşen DURUR ve sorar.

## Komutlar
- build: `pnpm build`
- test: `pnpm test`
- typecheck: `pnpm typecheck`
- lint: `pnpm lint`

> e2e ayrı: `pnpm test:e2e` (Playwright). DB: `pnpm db:generate` (Drizzle şema →
> migration), `pnpm db:migrate`, `pnpm seed`.

## Branch
- çalışma: `main`
- prod hedefi: `main`
- dokunma:

> Tek branch. Deploy sunucuda `git pull` ile `main`'i çeker — yani `main`'e push
> **prod'a aday kod** demektir.

## Git
- auto-push: false
- commit scope: `app`, `worker`, `db`, `auth`, `billing`, `infra`, `docs`, `claude`

> Tek `main` var, tampon dal yok ve `app.steadel.com` canlı. Push açık onayla.

## Deploy
- mekanizma: sunucuda `/opt/steadel/deploy.sh` — **`git pull` → `docker compose build` → `docker compose up -d --no-build` → sağlık kontrolü**
- tetikleyen: Sercan (sunucuda elle çalıştırır) — **Claude deploy tetiklemez**
- servisler: `app` · `worker` · `migrate` (tek seferlik, app/worker'dan önce koşar) · `postgres` · `redis` · `caddy` · `uptime-kuma`
- test URL: (ayrı test ortamı yok)
- prod URL: `app.steadel.com` (uygulama) · `steadel.com` + `www.steadel.com` (pazarlama) · `status.steadel.com`
- kapsam kuralı: tek imaj — her değişiklik `docker compose build` gerektirir. Migration'ı ayrı `migrate` servisi uygular, elle çalıştırılmaz.

> ⛔ **`docker compose up -d --build` KULLANMA.** `deploy.sh` bunu açıkça
> yasaklıyor: compose önce konteynerleri durdurup *sonra* dakikalarca build ediyor;
> build sırasında Docker daemon çökerse (BuildKit `concurrent map iteration`
> paniği) kasıtlı durdurulmuş konteyner `restart: unless-stopped` ile geri
> **gelmiyor**. Bu **prod'u iki kez düşürdü**. Doğrusu: önce build, sonra swap —
> yani `deploy.sh`.
>
> Not: `DECISIONS.md` M0/5 hâlâ eski `up -d --build` kalıbını tarif ediyor;
> **`deploy.sh` doğru olandır** (2026-08-03 kaynaktan doğrulandı).
>
> `deploy.sh` sonunda üç URL'yi 200 bekleyerek sağlık kontrolü yapar; kırmızıysa
> exit 1.

## Veri
- db: postgres
- erişim: sunucuda docker (`/opt/steadel`, compose servisi `postgres`); yerel geliştirmede `postgres://steadel:steadel@localhost:55432/steadel`
- test hedefi: yerel `localhost:55432`
- prod hedefi: sunucudaki `postgres` compose servisi
- migration aracı: drizzle

> Drizzle'da **otomatik kapsam filtresi yoktur** — her sorgu `orgId` koşulunu
> kendisi taşımalıdır. Bkz. `parsius-web:review-rules` #1b.

## API
- envelope: none

## Auth
- role prefix: none

> Auth.js, JWT (cookie) oturumları + Credentials provider. Magic link'ler kendi
> `auth_tokens` tablomuzda tek kullanımlık token olarak. Parola hash'i Argon2id
> (`@node-rs/argon2`).

## Tasarım
- token prefix: `--color-`

## i18n
- var: false
- dosyalar:
- key konvansiyonu:

> i18n bağımlılığı yok (2026-08-03 doğrulandı). Hardcoded metin ihlal değildir.

## Devir notu
- dosya: `DECISIONS.md`

> SPEC'in kapsamadığı kararlar buraya yazılır: "en basit çalışan seçeneği seç ve
> belgele". `PROGRESS.md` ve `BACKLOG.md` de durum taşır.

## İnceleme
- ek kurallar: `.claude/review-rules.md`

## Keşif
- çıktı dizini: `docs/kesif/`

## Test
- ek kurallar: `.claude/test-rules.md`
