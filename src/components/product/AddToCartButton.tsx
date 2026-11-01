'use client';

import { useEffect, useRef, useState } from 'react';
import { CartIcon, CheckIcon } from '@/components/Icons';
import { useCart } from '@/components/cart/CartProvider';
import { useI18n } from '@/components/I18nProvider';

export function AddToCartButton({
  productId,
  stock,
  qty = 1,
  size = 'sm',
}: {
  productId: string;
  stock: number;
  qty?: number;
  size?: 'sm' | 'lg';
}) {
  const { t } = useI18n();
  const { add, lines } = useCart();
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const inCart = lines.find((l) => l.id === productId)?.qty ?? 0;
  const out = stock <= 0;
  const maxed = !out && inCart >= stock;

  const onClick = () => {
    add(productId, Math.max(1, Math.min(qty, stock - inCart)), stock);
    setDone(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), 1600);
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={out || maxed}
        className={`${done ? 'btn bg-blue text-navy shadow-soft' : 'btn-primary'} w-full ${size === 'sm' ? 'btn-sm' : 'min-h-14 text-lg'}`}
      >
        {done ? <CheckIcon size={20} /> : <CartIcon size={size === 'sm' ? 18 : 22} />}
        {out ? t.common.outOfStock : done ? t.common.added : t.common.addToCart}
      </button>
      <span className="sr-only" role="status" aria-live="polite">{done ? t.common.added : ''}</span>
    </>
  );
}
