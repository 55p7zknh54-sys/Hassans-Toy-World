// Builds supabase/seed.sql from data/catalog.json (sample categories, products, delivery fees).
// Run:  npm run seed:generate
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(readFileSync(resolve(root, 'data/catalog.json'), 'utf8'));
// Products are NOT seeded by default (the store starts empty). `--with-samples [out]` adds data/sample-products.json (used by the DB tests).
const withSamples = process.argv.includes('--with-samples');
if (withSamples) catalog.products = JSON.parse(readFileSync(resolve(root, 'data/sample-products.json'), 'utf8')).products;
const outArg = process.argv.slice(2).find((a) => !a.startsWith('--'));

const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const n = (v) => (v === null || v === undefined ? 'null' : String(Number(v)));

const out = [];
out.push(`-- =====================================================================
-- Hassan's Toys World sample data (generated from data/catalog.json by scripts/generate-seed-sql.mjs).
-- Run AFTER schema.sql. Prices are IQD DEMONSTRATION values — edit them in the admin dashboard.
-- Delivery fees are placeholders too: set your real courier prices under Admin → Delivery.
-- =====================================================================
`);

out.push('-- Delivery fees (all 19 governorates; Halabja is the newest governorate — hide it in Admin → Delivery if you do not serve it)');
out.push('insert into public.delivery_fees (code, name_en, name_ar, fee_iqd, sort_order) values');
out.push(
  catalog.delivery_fees
    .map((d) => `  (${q(d.code)}, ${q(d.name_en)}, ${q(d.name_ar)}, ${n(d.fee)}, ${n(d.sort_order)})`)
    .join(',\n') + ';\n'
);

out.push('-- Categories');
out.push('insert into public.categories (slug, name_en, name_ar, description_en, description_ar, image_url, color, sort_order) values');
out.push(
  catalog.categories
    .map(
      (c) =>
        `  (${q(c.slug)}, ${q(c.name_en)}, ${q(c.name_ar)}, ${q(c.description_en)}, ${q(c.description_ar)}, ${q(c.image)}, ${q(c.color)}, ${n(c.sort_order)})`
    )
    .join(',\n') + ';\n'
);

out.push('-- Products');
for (const p of catalog.products) {
  const images = [1, 2, 3].map((i) => q(`/products/${p.slug}-${i}.svg`)).join(', ');
  out.push(
    `insert into public.products (slug, category_id, name_en, name_ar, description_en, description_ar, price_iqd, sale_price_iqd, stock, images, featured, best_seller, created_at)
select ${q(p.slug)}, c.id, ${q(p.name_en)}, ${q(p.name_ar)}, ${q(p.description_en)}, ${q(p.description_ar)}, ${n(p.price)}, ${n(p.sale_price)}, ${n(p.stock)}, array[${images}], ${p.featured}, ${p.best_seller}, now() - interval '${Number(p.days_ago)} days'
from public.categories c where c.slug = ${q(p.category)};`
  );
  out.push(
    `insert into public.product_costs (product_id, cost_iqd) select id, ${n(p.cost)} from public.products where slug = ${q(p.slug)};`
  );
}
out.push('');

const file = outArg ? resolve(outArg) : resolve(root, 'supabase/seed.sql');
mkdirSync(dirname(file), { recursive: true });
writeFileSync(file, out.join('\n'));
console.log(`Wrote ${file} (${catalog.products.length} products, ${catalog.delivery_fees.length} delivery fees)`);
