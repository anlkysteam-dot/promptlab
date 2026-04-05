# PromptLab — PostgreSQL ve canlıya alma

## Özet

- Veritabanı artık **PostgreSQL** (Prisma `provider = postgresql`).
- Yerelde **Docker Compose** ile Postgres ayağa kaldırılır; canlıda **Neon**, **Supabase**, **Railway Postgres** veya **Vercel Postgres** gibi bir hizmetin `DATABASE_URL` değeri kullanılır.
- Üretim build sırasında `prisma migrate deploy` çalışır; tablolar otomatik oluşur.

## Yerel geliştirme

1. Docker Desktop açık olsun.

2. Postgres’i başlat:

   ```bash
   docker compose up -d
   ```

3. `.env` içinde (`.env.example` şablonuna bakın):

   ```env
   DATABASE_URL="postgresql://promptlab:promptlab@localhost:5432/promptlab?schema=public"
   ```

4. Şemayı uygula:

   ```bash
   npx prisma migrate deploy
   ```

   İstersen geliştirme için:

   ```bash
   npm run db:migrate:dev
   ```

5. Uygulama:

   ```bash
   npm run dev
   ```

**Not:** Eski SQLite `dev.db` kullanılmaz; kullanıcı / test verisini yeniden oluşturman gerekir.

## Vercel

1. Repo’yu Vercel’e bağla.
2. **Environment variables** ekle (Production + Preview):
   - `DATABASE_URL` — Neon **pooled** (Transaction) connection string.
   - `DIRECT_DATABASE_URL` — Neon **direct** (non-pooling) connection string (`prisma migrate deploy` bunu kullanır).
   - Clerk, Stripe, OpenAI/Groq, `NEXT_PUBLIC_APP_URL` (örn. `https://senin-domain.vercel.app`) vb.
3. **Build Command** varsayılan `npm run build` yeterli; script içinde `prisma migrate deploy` vardır.
4. İlk deploy öncesi veritabanı boş olmalı; migrate tabloları oluşturur.
5. **Clerk**: Production instance’ta izin verilen origin ve redirect URL’lerine Vercel domain’ini ekle.
6. **Stripe webhook**: Canlı URL’yi `https://senin-domain/api/stripe/webhook` olarak güncelle.

### Neon: pooler + direct (Prisma)

`schema.prisma` içinde `url` + `directUrl` tanımlı:

- **`DATABASE_URL`**: Pooled (Transaction) — runtime sorgular, serverless uyumlu.
- **`DIRECT_DATABASE_URL`**: Direct — `prisma migrate deploy` ve şema işlemleri.

Neon arayüzünde iki ayrı string kopyalanır; Vercel’de ikisini de aynı isimle env olarak ekle.

Yerelde tek Postgres (Docker) kullanıyorsan iki değişkene **aynı** URL’yi ver.

## Railway

1. Yeni proje → **PostgreSQL** ekle → `DATABASE_URL`’i kopyala (genelde `postgres://...`).
2. Aynı projeye veya ayrı **Web** servisi ile Next.js deploy et; `DATABASE_URL`’i servis env’e yapıştır.
3. `NEXT_PUBLIC_APP_URL` olarak Railway’in verdiği public URL’yi kullan.

## Neon (önerilen sunucusuz Postgres)

1. [neon.tech](https://neon.tech) üzerinde proje oluştur.
2. Connection details’ten **pooled** → `DATABASE_URL`, **direct** → `DIRECT_DATABASE_URL`.
3. Vercel / Railway build aşamasında `migrate deploy` doğrudan bağlantıyı kullanır.

## Kontrol listesi (canlı öncesi)

- [ ] `DATABASE_URL` ve `DIRECT_DATABASE_URL` üretimde set (Neon: pooled + direct)
- [ ] `npm run build` veya CI’da migrate hatasız
- [ ] Clerk production keys + domain
- [ ] Stripe canlı veya test webhook secret güncel
- [ ] `NEXT_PUBLIC_APP_URL` gerçek site adresi
