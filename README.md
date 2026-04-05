# PromptLab

Ne istediğini düz dille yaz; hedef yapay zekaya uygun **İngilizce** prompt üretir. Ücretsiz: günde **10** dönüşüm (Europe/Istanbul günü). Premium: limit yok — **Stripe** aboneliği + webhook ile `isPremium` güncellenir; geliştirmede `PREMIUM_EMAILS` de kullanılabilir.

**Kimlik:** [Clerk](https://clerk.com) (`/auth`, `/auth/kayit`).

## Gereksinimler

- Node.js 20+
- Docker Desktop (yerel PostgreSQL için) veya bulut Postgres URL’si
- OpenAI veya Groq API anahtarı (veya geliştirmede `PROMPTLAB_GENERATE_MODE=mock`)

## Kurulum (yerel)

```bash
cd promptlab
copy .env.example .env
```

1. **PostgreSQL:** Proje kökünde:

   ```bash
   docker compose up -d
   ```

2. `.env` içinde Postgres URL’leri (`.env.example` açıklamalarına bak):

   - **Neon:** `DATABASE_URL` (pooled) + `DIRECT_DATABASE_URL` (direct).
   - **Yerel Docker:** ikisine aynı: `postgresql://promptlab:promptlab@localhost:5432/promptlab?schema=public`

3. Şema:

   ```bash
   npm install
   npx prisma migrate deploy
   npm run dev
   ```

`.env` için ayrıca: Clerk anahtarları, `OPENAI_API_KEY` veya Groq, isteğe bağlı Stripe ve `NEXT_PUBLIC_APP_URL`. Ayrıntılı env listesi: `.env.example`.

**Canlıya alma (Vercel / Railway / Neon):** [DEPLOY.md](./DEPLOY.md)

### Stripe (kısa)

1. [Stripe Dashboard](https://dashboard.stripe.com/) → **Ürünler** → abonelik fiyatı → **Price ID** → `STRIPE_PRICE_ID_PREMIUM`.
2. Webhook: `https://SİTE/api/stripe/webhook` — olaylar: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
3. Ödeme: giriş yap → **/pricing** → “Premium’a geç”.
4. Müşteri portalı Stripe Dashboard’dan etkin olmalı.

Tarayıcı: [http://localhost:3000](http://localhost:3000)

## Komutlar

| Komut | Açıklama |
|--------|----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | `prisma migrate deploy` + üretim derlemesi |
| `npm run db:migrate` | Migrate deploy (CI / sunucu) |
| `npm run db:migrate:dev` | Yeni migration geliştirme |
| `npm run db:studio` | Prisma Studio |
