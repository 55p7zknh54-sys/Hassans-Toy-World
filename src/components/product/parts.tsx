import { StarIcon } from '@/components/Icons';
import { fmt, getDict } from '@/i18n';
import { formatIQD } from '@/lib/format';
import { discountPercent, effectivePrice, isOnSale, stockState, type Priced } from '@/lib/pricing';
import type { Lang } from '@/lib/types';

/** Normal price, or sale price with the old price struck through. */
export function PriceTag({ p, lang, size = 'md' }: { p: Priced; lang: Lang; size?: 'md' | 'lg' }) {
  const onSale = isOnSale(p);
  const big = size === 'lg';
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={`ltr-iso font-display font-bold ${onSale ? 'text-pink-700' : 'text-navy'} ${big ? 'text-3xl' : 'text-lg'}`}>
        {formatIQD(effectivePrice(p), lang)}
      </span>
      {onSale && (
        <>
          <span className={`ltr-iso text-navy-300 line-through ${big ? 'text-lg' : 'text-sm'}`}>
            <span className="sr-only">{getDict(lang).common.price}: </span>
            {formatIQD(p.price_iqd, lang)}
          </span>
          <span className="rounded-full bg-pink-100 px-2 py-0.5 font-display text-xs font-bold text-pink-700">
            {fmt(getDict(lang).common.save, { pct: discountPercent(p) })}
          </span>
        </>
      )}
    </p>
  );
}

export function StockBadge({ stock, lang }: { stock: number; lang: Lang }) {
  const t = getDict(lang).common;
  const s = stockState(stock);
  const cls =
    s === 'out' ? 'bg-navy-100 text-navy-500' : s === 'low' ? 'bg-yellow-100 text-navy' : 'bg-blue-100 text-blue-600';
  const text = s === 'out' ? t.outOfStock : s === 'low' ? fmt(t.lowStock, { n: stock }) : t.inStock;
  return (
    <span className={`chip ${cls}`}>
      <span className={`h-2 w-2 rounded-full ${s === 'out' ? 'bg-navy-300' : s === 'low' ? 'bg-yellow-600' : 'bg-blue'}`} aria-hidden="true" />
      {text}
    </span>
  );
}

export function Stars({ value, size = 18, label }: { value: number; size?: number; label?: string }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5 text-yellow-600" role="img" aria-label={label ?? `${value} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} size={size} filled={n <= rounded} className={n <= rounded ? '' : 'text-navy-100'} />
      ))}
    </span>
  );
}
