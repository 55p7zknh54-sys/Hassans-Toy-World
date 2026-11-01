'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCart } from './CartProvider';
import { useI18n } from '@/components/I18nProvider';
import { fmt } from '@/i18n';
import { effectivePrice } from '@/lib/pricing';
import { pick } from '@/lib/types';

export type CartProduct = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  price_iqd: number;
  sale_price_iqd: number | null;
  sale_ends_at: string | null;
  stock: number;
  image: string | null;
};

export type CartItem = { product: CartProduct; qty: number; unit: number; name: string; lineTotal: number };

/** Joins the saved cart (ids + quantities) with fresh product info from the server, and fixes anything out of date. */
export function useCartProducts() {
  const { t, lang } = useI18n();
  const { lines, ready, setQty, remove } = useCart();
  const [map, setMap] = useState<Record<string, CartProduct>>({});
  const [loaded, setLoaded] = useState(false);
  const [notices, setNotices] = useState<string[]>([]);
  const key = useMemo(() => lines.map((l) => l.id).sort().join(','), [lines]);

  useEffect(() => {
    if (!ready) return;
    if (!key) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    fetch(`/api/cart-products?ids=${encodeURIComponent(key)}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d: { products: CartProduct[] }) => {
        if (cancelled) return;
        setMap(Object.fromEntries(d.products.map((p) => [p.id, p])));
        setLoaded(true);
      })
      .catch(() => !cancelled && setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [ready, key]);

  // Remove items that disappeared / sold out, and lower quantities above the stock.
  useEffect(() => {
    if (!loaded) return;
    const msgs: string[] = [];
    for (const l of lines) {
      const p = map[l.id];
      if (!p || p.stock <= 0) {
        remove(l.id);
        msgs.push(t.cart.unavailable);
      } else if (l.qty > p.stock) {
        setQty(l.id, p.stock);
        msgs.push(fmt(t.cart.stockAdjusted, { name: pick(p, 'name', lang), n: p.stock }));
      }
    }
    if (msgs.length) setNotices((prev) => [...new Set([...prev, ...msgs])]);
  }, [loaded, map, lines, remove, setQty, t, lang]);

  const items: CartItem[] = useMemo(
    () =>
      lines.flatMap((l) => {
        const p = map[l.id];
        if (!p || p.stock <= 0) return [];
        const qty = Math.min(l.qty, p.stock);
        const unit = effectivePrice(p);
        return [{ product: p, qty, unit, name: pick(p, 'name', lang), lineTotal: unit * qty }];
      }),
    [lines, map, lang]
  );

  return { items, loading: !ready || !loaded, notices, dismissNotices: () => setNotices([]) };
}
