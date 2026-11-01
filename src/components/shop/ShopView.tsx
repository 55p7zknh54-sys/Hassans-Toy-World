import { Suspense } from 'react';
import { Mascot } from '@/components/brand/Mascot';
import { ProductGrid } from '@/components/product/ProductCard';
import { filterProducts, isSortKey, type ShopQuery } from '@/lib/catalog-filter';
import { fmt, getDict, localePath } from '@/i18n';
import type { Category, Lang, Product } from '@/lib/types';
import { FilterBar } from './FilterBar';

export type RawSearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

/** Reads ?q=&category=&sort=&sale=1&best=1&instock=1 from the URL. */
export function parseShopQuery(sp: RawSearchParams): ShopQuery {
  const sort = one(sp.sort);
  return {
    q: one(sp.q).slice(0, 80),
    category: one(sp.category) || undefined,
    sort: isSortKey(sort) ? sort : 'newest',
    sale: one(sp.sale) === '1',
    best: one(sp.best) === '1',
    inStock: one(sp.instock) === '1',
  };
}

/** Product listing page body, shared by Shop, category, new arrivals, best sellers and sale pages. */
export function ShopView({
  lang, all, categories, query, basePath, title, subtitle, showCategories = true,
}: {
  lang: Lang;
  all: Product[];
  categories: Category[];
  query: ShopQuery;
  basePath: string;
  title: string;
  subtitle?: string;
  showCategories?: boolean;
}) {
  const t = getDict(lang);
  const list = filterProducts(all, query);
  const heading = query.q ? fmt(t.shop.searchFor, { q: query.q }) : title;
  return (
    <div className="container-page py-8 sm:py-12">
      <header className="mb-6">
        <h1 className="text-3xl sm:text-5xl">{heading}</h1>
        {subtitle && !query.q && <p className="mt-2 text-lg text-navy-500">{subtitle}</p>}
      </header>
      <Suspense fallback={<div className="card h-40" />}>
        <FilterBar basePath={localePath(lang, basePath)} categories={categories} showCategories={showCategories} />
      </Suspense>
      <p className="mb-4 mt-6 text-sm font-semibold text-navy-500" aria-live="polite">
        {list.length === 1 ? t.shop.resultsOne : fmt(t.shop.results, { n: list.length })}
      </p>
      {list.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-12 text-center">
          <Mascot size={88} />
          <h2 className="text-2xl">{t.shop.noResults}</h2>
          <p className="text-navy-500">{t.shop.noResultsText}</p>
        </div>
      ) : (
        <ProductGrid products={list} lang={lang} eager={4} />
      )}
    </div>
  );
}
