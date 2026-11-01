/** Price helpers. Prices always come from the database — never hard-code them. */

export type Priced = {
  price_iqd: number;
  sale_price_iqd: number | null;
  sale_ends_at?: string | null;
};

export function isOnSale(p: Priced, now: number = Date.now()): boolean {
  if (p.sale_price_iqd == null || p.sale_price_iqd >= p.price_iqd) return false;
  if (p.sale_ends_at) {
    const end = Date.parse(p.sale_ends_at);
    if (!Number.isNaN(end) && end <= now) return false;
  }
  return true;
}

/** The price the customer actually pays (mirrors SQL effective_price()). */
export function effectivePrice(p: Priced, now: number = Date.now()): number {
  return isOnSale(p, now) ? (p.sale_price_iqd as number) : p.price_iqd;
}

export function discountPercent(p: Priced, now: number = Date.now()): number {
  if (!isOnSale(p, now) || p.price_iqd <= 0) return 0;
  return Math.round(((p.price_iqd - (p.sale_price_iqd as number)) / p.price_iqd) * 100);
}

export type Totals = { subtotal: number; deliveryFee: number | null; total: number | null };

/** deliveryFee = null while the customer has not chosen a governorate yet. */
export function computeTotals(
  lines: { unit: number; qty: number }[],
  deliveryFee: number | null
): Totals {
  const subtotal = lines.reduce((sum, l) => sum + l.unit * l.qty, 0);
  return { subtotal, deliveryFee, total: deliveryFee == null ? null : subtotal + deliveryFee };
}

/** Keeps a quantity between 1 and min(stock, max). Returns 0 when nothing is in stock. */
export function clampQty(qty: number, stock: number, max: number): number {
  const cap = Math.max(0, Math.min(stock, max));
  if (cap === 0) return 0;
  const q = Number.isFinite(qty) ? Math.floor(qty) : 1;
  return Math.min(Math.max(q, 1), cap);
}

export type StockState = 'in_stock' | 'low' | 'out';
export function stockState(stock: number): StockState {
  if (stock <= 0) return 'out';
  return stock <= 5 ? 'low' : 'in_stock';
}
