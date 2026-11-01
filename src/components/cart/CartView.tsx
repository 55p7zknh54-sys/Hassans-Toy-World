'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Mascot } from '@/components/brand/Mascot';
import { AlertIcon, TrashIcon } from '@/components/Icons';
import { useI18n } from '@/components/I18nProvider';
import { QuantityPicker } from '@/components/product/QuantityPicker';
import { fmt } from '@/i18n';
import { formatIQD } from '@/lib/format';
import { useCart } from './CartProvider';
import { useCartProducts } from './useCartProducts';

export function CartView() {
  const { t, lang, href } = useI18n();
  const { setQty, remove } = useCart();
  const { items, loading, notices, dismissNotices } = useCartProducts();
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  if (loading) {
    return <div className="grid gap-4 lg:grid-cols-3" aria-busy="true"><div className="card h-64 lg:col-span-2" /><div className="card h-64" /></div>;
  }
  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-4 p-12 text-center">
        <Mascot size={110} sparkles className="animate-float" />
        <h2 className="text-2xl">{t.cart.emptyTitle}</h2>
        <p className="text-navy-500">{t.cart.emptyText}</p>
        <Link href={href('/shop')} className="btn-primary">{t.common.continueShopping}</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notices.length > 0 && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl bg-yellow-100 p-4 text-sm font-semibold">
          <AlertIcon className="mt-0.5 shrink-0" size={20} />
          <ul className="flex-1">{notices.map((n) => <li key={n}>{n}</li>)}</ul>
          <button type="button" onClick={dismissNotices} className="underline">{t.common.close}</button>
        </div>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <ul className="space-y-3 lg:col-span-2">
          {items.map(({ product: p, qty, unit, name, lineTotal }) => (
            <li key={p.id} className="card flex gap-4 p-3 sm:p-4">
              <Link href={href(`/product/${p.slug}`)} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-cream-dark sm:h-28 sm:w-28">
                {p.image && <Image src={p.image} alt="" fill sizes="112px" className="object-cover" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <Link href={href(`/product/${p.slug}`)} className="font-display font-semibold leading-snug hover:text-pink-700">{name}</Link>
                  <button type="button" onClick={() => remove(p.id)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-navy-500 hover:bg-pink-100 hover:text-pink-700" aria-label={`${t.cart.remove}: ${name}`}>
                    <TrashIcon size={20} />
                  </button>
                </div>
                <p className="ltr-iso text-sm text-navy-500">{formatIQD(unit, lang)}</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                  <QuantityPicker compact value={qty} onChange={(n) => setQty(p.id, n)} max={Math.min(p.stock, 99)} />
                  <p className="ltr-iso font-display text-lg font-bold">{formatIQD(lineTotal, lang)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="card sticky top-32 space-y-4 p-6">
          <p className="text-sm font-semibold text-navy-500">{count === 1 ? t.cart.itemOne : fmt(t.cart.items, { n: count })}</p>
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">{t.common.subtotal}</span>
            <span className="ltr-iso font-display text-2xl font-bold">{formatIQD(subtotal, lang)}</span>
          </div>
          <p className="rounded-2xl bg-blue-100 p-3 text-sm text-navy-700">{t.cart.deliveryNote}</p>
          <Link href={href('/checkout')} className="btn-primary min-h-14 w-full text-lg">{t.cart.checkout}</Link>
          <Link href={href('/shop')} className="btn-ghost w-full">{t.common.continueShopping}</Link>
        </aside>
      </div>
    </div>
  );
}
