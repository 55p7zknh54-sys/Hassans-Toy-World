import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Mascot } from '@/components/brand/Mascot';
import { CashIcon, ChatIcon, ChevronIcon, GiftIcon, TruckIcon } from '@/components/Icons';
import { ProductGrid } from '@/components/product/ProductCard';
import { Stars } from '@/components/product/parts';
import { formatDate } from '@/lib/format';
import { getDict, localePath } from '@/i18n';
import { pick, type Category, type Lang, type Product, type Review, type StoreSettings } from '@/lib/types';

export function SectionHeader({ title, sub, href, lang }: { title: string; sub?: string; href?: string; lang: Lang }) {
  const t = getDict(lang);
  return (
    <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
      <div>
        <h2 className="section-title">{title}</h2>
        {sub && <p className="mt-1 text-navy-500">{sub}</p>}
      </div>
      {href && (
        <Link href={href} className="btn-ghost btn-sm shrink-0">
          {t.common.viewAll} <ChevronIcon size={16} className="rtl-flip" />
        </Link>
      )}
    </div>
  );
}

export function ProductSection({
  title, sub, href, products, lang, eager = 0,
}: { title: string; sub?: string; href?: string; products: Product[]; lang: Lang; eager?: number }) {
  if (products.length === 0) return null;
  return (
    <section className="container-page py-10 sm:py-14">
      <SectionHeader title={title} sub={sub} href={href} lang={lang} />
      <ProductGrid products={products} lang={lang} eager={eager} />
    </section>
  );
}

const CAT_COLORS: Record<Category['color'], string> = {
  pink: 'bg-pink-100 hover:bg-pink-200',
  yellow: 'bg-yellow-100 hover:bg-yellow-200',
  blue: 'bg-blue-100 hover:bg-blue-200',
  purple: 'bg-purple-100 hover:bg-purple-200',
};

export function CategoryGrid({ categories, lang }: { categories: Category[]; lang: Lang }) {
  const t = getDict(lang);
  const card = 'group flex h-full flex-col items-center gap-3 rounded-3xl p-4 text-center shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift';
  return (
    <section className="container-page py-10 sm:py-14">
      <SectionHeader title={t.home.categoriesTitle} sub={t.home.categoriesSub} lang={lang} />
      <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-6">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link href={localePath(lang, `/category/${c.slug}`)} className={`${card} ${CAT_COLORS[c.color] ?? CAT_COLORS.pink}`}>
              <span className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white/70">
                {c.image_url ? (
                  <Image src={c.image_url} alt="" fill sizes="(min-width: 1024px) 15vw, 45vw" className="object-cover transition duration-500 group-hover:scale-110" />
                ) : (
                  <Mascot size={80} className="absolute inset-0 m-auto" />
                )}
              </span>
              <span className="font-display text-lg font-bold">{pick(c, 'name', lang)}</span>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-navy-700">
                {t.home.exploreCategory} <ChevronIcon size={14} className="rtl-flip transition group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </span>
            </Link>
          </li>
        ))}
        <li>
          <Link href={localePath(lang, '/new-arrivals')} className={`${card} bg-yellow hover:bg-yellow-200`}>
            <span className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl bg-white/60">
              <Mascot size={110} sparkles className="animate-float" />
            </span>
            <span className="font-display text-lg font-bold">{t.nav.newArrivals}</span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-navy-700">
              {t.home.exploreCategory} <ChevronIcon size={14} className="rtl-flip" />
            </span>
          </Link>
        </li>
      </ul>
    </section>
  );
}

export function PromoBanner({ lang, settings }: { lang: Lang; settings: StoreSettings }) {
  if (!settings.promo_active) return null;
  const t = getDict(lang);
  const title = lang === 'ar' ? settings.promo_title_ar : settings.promo_title_en;
  const text = lang === 'ar' ? settings.promo_text_ar : settings.promo_text_en;
  return (
    <section className="container-page py-6">
      <div className="relative isolate overflow-hidden rounded-blob bg-gradient-to-br from-purple via-pink to-pink-600 p-8 text-white shadow-lift sm:p-12">
        <div className="absolute -end-10 -top-10 -z-10 h-56 w-56 rounded-full bg-white/15" aria-hidden="true" />
        <div className="absolute -bottom-16 start-1/3 -z-10 h-56 w-56 rounded-full bg-yellow/25" aria-hidden="true" />
        <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-start">
          <Mascot size={120} sparkles className="shrink-0 animate-float" />
          <div className="flex-1">
            <h2 className="text-balance text-3xl font-bold !text-white sm:text-5xl">{title}</h2>
            {text && <p className="mt-2 max-w-xl text-lg text-white/90">{text}</p>}
          </div>
          <Link href={localePath(lang, '/shop')} className="btn-yellow min-h-14 shrink-0 px-8 text-lg">
            {t.common.shopNow}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function WhyShop({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const icons: ReactNode[] = [
    <TruckIcon key="t" size={30} />, <CashIcon key="c" size={30} />, <GiftIcon key="g" size={30} />, <ChatIcon key="h" size={30} />,
  ];
  const tints = ['bg-blue-100 text-blue-600', 'bg-pink-100 text-pink-700', 'bg-yellow-100 text-navy', 'bg-purple-100 text-purple-600'];
  return (
    <section className="container-page py-10 sm:py-14">
      <h2 className="section-title mb-8 text-center">{t.home.whyTitle}</h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t.home.why.map((w, i) => (
          <li key={w.title} className="card flex flex-col items-center gap-3 p-6 text-center">
            <span className={`grid h-16 w-16 place-items-center rounded-2xl ${tints[i]}`}>{icons[i]}</span>
            <h3 className="text-lg">{w.title}</h3>
            <p className="text-sm text-navy-500">{w.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Shows ONLY real, admin-approved reviews. When there are none yet it says so — nothing is invented. */
export function ReviewsSection({ lang, reviews }: { lang: Lang; reviews: Review[] }) {
  const t = getDict(lang);
  return (
    <section className="container-page py-10 sm:py-14">
      <SectionHeader title={t.home.reviewsTitle} sub={t.home.reviewsSub} lang={lang} />
      {reviews.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <Mascot size={72} />
          <h3 className="text-xl">{t.home.reviewsEmptyTitle}</h3>
          <p className="max-w-md text-navy-500">{t.home.reviewsEmptyText}</p>
          <Link href={localePath(lang, '/shop')} className="btn-primary mt-2">{t.home.reviewsCta}</Link>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <li key={r.id} className="card flex flex-col gap-3 p-6">
              <Stars value={r.rating} />
              <p className="flex-1 text-navy-700">“{r.body}”</p>
              <div className="text-sm">
                <p className="font-display font-bold">{r.reviewer_name}</p>
                <p className="text-navy-500">
                  {r.product_slug && (
                    <Link href={localePath(lang, `/product/${r.product_slug}`)} className="hover:text-pink-700">
                      {lang === 'ar' ? r.product_name_ar : r.product_name_en}
                    </Link>
                  )}{' '}
                  · {formatDate(r.created_at, lang)}
                </p>
                {r.verified_purchase && <p className="mt-1 font-semibold text-blue-600">✓ {t.product.verified}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
