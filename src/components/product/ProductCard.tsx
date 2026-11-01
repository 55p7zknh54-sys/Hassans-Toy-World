import Image from 'next/image';
import Link from 'next/link';
import { getDict, localePath } from '@/i18n';
import { isOnSale } from '@/lib/pricing';
import { pick, type Lang, type Product } from '@/lib/types';
import { AddToCartButton } from './AddToCartButton';
import { PriceTag, Stars, StockBadge } from './parts';

const NEW_DAYS = 14;

export function ProductCard({ p, lang, priority = false }: { p: Product; lang: Lang; priority?: boolean }) {
  const t = getDict(lang);
  const name = pick(p, 'name', lang);
  const href = localePath(lang, `/product/${p.slug}`);
  const onSale = isOnSale(p);
  const isNew = Date.now() - Date.parse(p.created_at) < NEW_DAYS * 86_400_000;
  const out = p.stock <= 0;
  const label = lang === 'ar' ? p.promo_label_ar ?? p.promo_label_en : p.promo_label_en ?? p.promo_label_ar;

  return (
    <article className="group relative flex w-full flex-col overflow-hidden rounded-3xl bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <Link href={href} className="relative block aspect-square overflow-hidden bg-cream-dark" tabIndex={-1} aria-hidden="true">
        {p.images[0] && (
          <Image
            src={p.images[0]}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw"
            className={`object-cover transition duration-500 group-hover:scale-105 ${out ? 'opacity-60 grayscale-[40%]' : ''}`}
          />
        )}
      </Link>
      <div className="pointer-events-none absolute start-3 top-3 flex flex-col items-start gap-1.5">
        {onSale && <span className="chip bg-pink-600 text-white shadow-soft">{t.common.sale}</span>}
        {p.best_seller && <span className="chip bg-yellow text-navy shadow-soft">★ {t.common.bestSeller}</span>}
        {isNew && !onSale && <span className="chip bg-purple-600 text-white shadow-soft">{t.common.newBadge}</span>}
        {label && <span className="chip bg-blue text-navy shadow-soft">{label}</span>}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-display text-base font-semibold leading-snug">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] hover:text-pink-700" style={{ position: 'static' }}>
            {name}
          </Link>
        </h3>
        {p.rating_count > 0 && p.rating_avg != null && (
          <span className="flex items-center gap-1.5 text-xs text-navy-500">
            <Stars value={p.rating_avg} size={14} /> <span className="ltr-iso">{p.rating_avg.toFixed(1)}</span>
          </span>
        )}
        <PriceTag p={p} lang={lang} />
        <div><StockBadge stock={p.stock} lang={lang} /></div>
        <div className="relative z-10 mt-auto pt-2">
          <AddToCartButton productId={p.id} stock={p.stock} />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, lang, eager = 0 }: { products: Product[]; lang: Lang; eager?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id} className="flex">
          <ProductCard p={p} lang={lang} priority={i < eager} />
        </li>
      ))}
    </ul>
  );
}
