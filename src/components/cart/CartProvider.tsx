'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type CartLine = { id: string; qty: number };

type CartCtx = {
  lines: CartLine[];
  /** false until the saved cart has been read from the browser (avoids a flash of "empty cart"). */
  ready: boolean;
  count: number;
  add: (id: string, qty?: number, max?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const KEY = 'hw_cart_v1';
const CartContext = createContext<CartCtx | null>(null);

function sanitize(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const out: CartLine[] = [];
  for (const r of raw) {
    if (r && typeof r.id === 'string' && Number.isInteger(r.qty) && r.qty > 0 && r.qty < 1000 && !out.some((o) => o.id === r.id)) {
      out.push({ id: r.id, qty: r.qty });
    }
  }
  return out;
}

/** The cart lives in the browser (saved between visits). It stores only product ids + quantities — prices are always re-read from the server. */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setLines(sanitize(JSON.parse(raw)));
    } catch {
      /* storage unavailable (private mode) — the cart still works for this visit */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines, ready]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      try {
        setLines(sanitize(JSON.parse(e.newValue ?? '[]')));
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((id: string, qty = 1, max = 99) => {
    setLines((prev) => {
      const found = prev.find((l) => l.id === id);
      if (found) return prev.map((l) => (l.id === id ? { ...l, qty: Math.min(l.qty + qty, max) } : l));
      return [...prev, { id, qty: Math.max(1, Math.min(qty, max)) }];
    });
  }, []);
  const setQty = useCallback((id: string, qty: number) => {
    setLines((prev) =>
      qty <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, qty: Math.floor(qty) } : l))
    );
  }, []);
  const remove = useCallback((id: string) => setLines((prev) => prev.filter((l) => l.id !== id)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartCtx>(
    () => ({ lines, ready, count: lines.reduce((s, l) => s + l.qty, 0), add, setQty, remove, clear }),
    [lines, ready, add, setQty, remove, clear]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
