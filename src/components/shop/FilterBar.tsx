'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { SearchIcon } from '@/components/Icons';
import { useI18n } from '@/components/I18nProvider';
import { pick, type Category } from '@/lib/types';

/** Search, category, sort and quick filters. Everything lives in the URL so results can be shared and bookmarked. */
export function FilterBar({
  basePath,
  categories,
  showCategories = true,
}: {
  basePath: string;
  categories: Category[];
  showCategories?: boolean;
}) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const [q, setQ] = useState(sp.get('q') ?? '');

  const set = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v == null || v === '') next.delete(k);
      else next.set(k, v);
    }
    const qs = next.toString();
    start(() => router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false }));
  };

  const category = sp.get('category') ?? '';
  const sort = sp.get('sort') ?? 'newest';
  const toggles: [string, string][] = [
    ['sale', t.shop.onSale],
    ['best', t.shop.bestSellersOnly],
    ['instock', t.shop.inStockOnly],
  ];
  const hasFilters = !!(sp.get('q') || category || sp.get('sale') || sp.get('best') || sp.get('instock') || (sp.get('sort') && sort !== 'newest'));

  return (
    <div className={`card space-y-4 p-4 sm:p-5 ${pending ? 'opacity-70' : ''}`} aria-busy={pending}>
      <div className="flex flex-col gap-3 md:flex-row">
        <form
          role="search"
          className="relative flex-1"
          onSubmit={(e) => { e.preventDefault(); set({ q: q.trim() || null }); }}
        >
          <label htmlFor="shop-q" className="sr-only">{t.common.search}</label>
          <input id="shop-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.shop.searchPlaceholder} className="field !rounded-full !ps-12" enterKeyHint="search" />
          <button type="submit" aria-label={t.common.search} className="absolute inset-y-0 start-1 my-auto grid h-10 w-10 place-items-center rounded-full text-navy-500 hover:text-pink-600">
            <SearchIcon size={20} />
          </button>
        </form>
        <div className="md:w-64">
          <label htmlFor="shop-sort" className="sr-only">{t.shop.sortBy}</label>
          <select id="shop-sort" value={sort} onChange={(e) => set({ sort: e.target.value === 'newest' ? null : e.target.value })} className="field !rounded-full">
            <option value="newest">{t.shop.sortNewest}</option>
            <option value="popular">{t.shop.sortPopular}</option>
            <option value="price-asc">{t.shop.sortPriceAsc}</option>
            <option value="price-desc">{t.shop.sortPriceDesc}</option>
          </select>
        </div>
      </div>

      {showCategories && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none" role="group" aria-label={t.common.category}>
          <Chip active={!category} onClick={() => set({ category: null })}>{t.shop.allCategories}</Chip>
          {categories.map((c) => (
            <Chip key={c.slug} active={category === c.slug} onClick={() => set({ category: c.slug })}>{pick(c, 'name', lang)}</Chip>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t.shop.filters}>
        {toggles.map(([key, label]) => (
          <Chip key={key} active={sp.get(key) === '1'} onClick={() => set({ [key]: sp.get(key) === '1' ? null : '1' })}>{label}</Chip>
        ))}
        {hasFilters && (
          <button type="button" className="ms-auto text-sm font-semibold text-pink-700 underline underline-offset-4" onClick={() => { setQ(''); start(() => router.replace(basePath, { scroll: false })); }}>
            {t.shop.clear}
          </button>
        )}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-11 shrink-0 whitespace-nowrap rounded-full px-4 font-display text-sm font-semibold transition ${active ? 'bg-pink-600 text-white shadow-pink' : 'bg-cream-dark text-navy hover:bg-pink-100'}`}
    >
      {children}
    </button>
  );
}
