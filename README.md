# Hassan's Toys World (عالم حسن للألعاب)

Online toy store for Iraq: English + Arabic (RTL), Cash on Delivery, IQD, per-governorate delivery fees, order protection, and an admin dashboard.
Stack: Next.js 15, React 19, TypeScript, Tailwind, Supabase (Postgres + Auth + Storage).

## 1. Run locally
```bash
npm install
cp .env.example .env.local   # fill in the 4 values (step 2)
npm run dev                  # http://localhost:3000
```
Without Supabase keys the site runs in **demo mode**: read-only, no checkout, no admin.

## 2. Set up Supabase (free tier is enough to start)
1. Create a project at supabase.com.
2. SQL Editor → run `supabase/schema.sql`, then `supabase/seed.sql` (categories + governorate fees; **no products**).
3. Authentication → Users → add yourself (email + strong password). Authentication → Providers → Email → **turn off "Allow new users to sign up"**.
4. Edit `supabase/make-admin.sql` with your email and run it (makes you the owner).
5. Project Settings → API: copy into `.env.local`
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (safe for browsers)
   - `SUPABASE_SERVICE_ROLE_KEY` (**secret, server only** – never share it or put it in client code)
   - `NEXT_PUBLIC_SITE_URL` = your final domain.
6. Log in at `/admin/login`.

## 3. Daily use (admin)
- **Prices / sale / stock**: Admin → Products (edit inline, or open a product for photos, descriptions, cost). Prices live only in the database.
- **Delivery fees**: Admin → Delivery (per governorate; untick "Delivers here" to disable one; add more).
- **Orders**: every order starts *Pending*. Call/WhatsApp the customer → **Approve** → Processing → Shipped → Delivered. Cancel/Return restock automatically. Flagged orders (large, repeat, previous failed deliveries) are highlighted. Optional deposit must be marked received before dispatch. Record failed deliveries on the order; 2 failures flag the customer.
- **WhatsApp, contact, social links, promo banner**: Admin → Settings (empty = hidden; nothing is invented).
- **Fake-order rules** (max quantities, duplicate window, rate limit, deposit): Admin → Settings.
- **Reviews**: customers submit, you approve in Admin → Reviews. No fake reviews are shown; the empty state is honest.
- **Staff**: Admin → Team (owner only).

## 4. Publish
Push to GitHub → import in Vercel → add the 4 env vars → deploy → add your domain and set `NEXT_PUBLIC_SITE_URL`.

## 5. Tests
`npm test` (pricing/phone/validation logic) and `npm run test:db` (needs local Postgres 16; checks schema, RLS, fraud rules, workflow).

## 6. Still needs your setup
Supabase project and keys, domain, your WhatsApp number and social links, real products/photos/costs, real courier fees, review the policy texts in `src/content/pages.ts`, courier agreements. Not built: email/SMS notifications, online payment, deposit collection (done manually).
