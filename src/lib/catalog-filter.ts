import { effectivePrice, isOnSale } from './pricing';
import type { Product } from './types';

/** Lower-cases and unifies Arabic letter variants so "اسكويشي" / "أسكويشي" / "سكويشي" style searches match. */
export function normalizeSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ًͯ-ٰٟـ]/g, '') // accents, Arabic diacritics, tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type SortKey = 'newest' | 'popular' | 'price-asc' | 'price-desc';
export type ShopQuery = {
  q?: string;
  category?: string;
  sort?: SortKey;
  sale?: boolean;
  best?: boolean;
  inStock?: boolean;
};

export const SORT_KEYS: readonly SortKey[] = ['newest', 'popular', 'price-asc', 'price-desc'];
export const isSortKey = (v: unknown): v is SortKey => SORT_KEYS.includes(v as SortKey);

export function filterProducts(all: Product[], query: ShopQuery, now: number = Date.now()): Product[] {
  const terms = normalizeSearch(query.q ?? '').split(' ').filter(Boolean);
  let list = all.filter((p) => {
    if (query.category && p.category_slug !== query.category) return false;
    if (query.sale && !isOnSale(p, now)) return false;
    if (query.best && !p.best_seller) return false;
    if (query.inStock && p.stock <= 0) return false;
    if (terms.length) {
      const hay = normalizeSearch(
        `${p.name_en} ${p.name_ar} ${p.description_en} ${p.description_ar} ${p.category_slug.replace(/-/g, ' ')}`
      );
      if (!terms.every((t) => hay.includes(t))) return false;
    }
    return true;
  });

  const sort = query.sort ?? 'newest';
  const byNewest = (a: Product, b: Product) => Date.parse(b.created_at) - Date.parse(a.created_at);
  list = [...list];
  if (sort === 'price-asc') list.sort((a, b) => effectivePrice(a, now) - effectivePrice(b, now) || byNewest(a, b));
  else if (sort === 'price-desc') list.sort((a, b) => effectivePrice(b, now) - effectivePrice(a, now) || byNewest(a, b));
  else if (sort === 'popular') list.sort((a, b) => Number(b.best_seller) - Number(a.best_seller) || byNewest(a, b));
  else list.sort(byNewest);
  return list;
}
