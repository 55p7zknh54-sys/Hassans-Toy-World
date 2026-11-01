'use client';

import Link from 'next/link';
import { CartIcon } from '@/components/Icons';
import { useCart } from '@/components/cart/CartProvider';
import { useI18n } from '@/components/I18nProvider';
import { fmt } from '@/i18n';

/** Cart indicator in the navigation bar, with the number of items. */
export function CartButton() {
  const { t, href } = useI18n();
  const { count, ready } = useCart();
  const n = ready ? count : 0;
  return (
    <Link
      href={href('/cart')}
      className="relative grid h-12 w-12 place-items-center rounded-full bg-pink-600 text-white shadow-pink transition hover:-translate-y-0.5 hover:bg-pink-700"
      aria-label={fmt(t.common.cartCount, { n })}
    >
      <CartIcon />
      {n > 0 && (
        <span
          key={n}
          className="absolute -end-1 -top-1 grid h-6 min-w-6 animate-pop place-items-center rounded-full bg-yellow px-1.5 text-xs font-extrabold text-navy ring-2 ring-cream"
        >
          {n > 99 ? '99+' : n}
        </span>
      )}
    </Link>
  );
}
