'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Mascot } from '@/components/brand/Mascot';
import { CheckIcon, WhatsAppIcon } from '@/components/Icons';
import { useI18n } from '@/components/I18nProvider';
import { fmt } from '@/i18n';
import type { Receipt } from '@/lib/action-types';
import { formatIQD } from '@/lib/format';
import { buildOrderMessage } from '@/lib/order-message';
import { whatsappLink } from '@/lib/phone';

export function OrderSuccess({ receipt: r, whatsapp }: { receipt: Receipt; whatsapp: string | null }) {
  const { t, lang, href } = useI18n();
  const [copied, setCopied] = useState(false);
  const f = (n: number) => formatIQD(n, lang);
  const items = r.items.map((i) => ({ name: lang === 'ar' ? i.name_ar : i.name_en, qty: i.quantity, lineTotal: i.line_total }));
  const waText = buildOrderMessage({
    lang, orderNumber: r.number, name: r.name, phone: r.phone,
    governorate: lang === 'ar' ? r.governorate_ar : r.governorate_en, city: r.city, address: r.address,
    items, subtotal: r.subtotal, deliveryFee: r.delivery_fee, total: r.total,
    depositAmount: r.deposit_required ? r.deposit_amount : undefined,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 text-center">
      <div className="relative inline-block">
        <Mascot size={120} sparkles className="animate-float" />
        <span className="absolute -bottom-1 -end-1 grid h-10 w-10 place-items-center rounded-full bg-blue text-navy ring-4 ring-cream"><CheckIcon size={22} /></span>
      </div>
      <h1 className="text-3xl sm:text-4xl">{t.success.title}</h1>
      <p className="text-lg text-navy-700">{t.success.text}</p>

      <div className="card space-y-1 p-6">
        <p className="text-sm font-semibold text-navy-500">{t.success.orderNumber}</p>
        <p className="ltr-iso select-all font-display text-3xl font-bold text-pink-700">{r.number}</p>
        <button
          type="button"
          className="text-sm font-semibold text-navy-500 underline underline-offset-4"
          onClick={() => { navigator.clipboard?.writeText(r.number).then(() => setCopied(true)).catch(() => {}); }}
        >
          {copied ? '✓' : t.success.saveNumber}
        </button>
      </div>

      <div className="card space-y-3 p-6 text-start">
        <h2 className="text-lg">{t.success.items}</h2>
        <ul className="divide-y divide-navy/10">
          {items.map((i, n) => (
            <li key={n} className="flex justify-between gap-3 py-2">
              <span>{i.name} <span className="ltr-iso text-navy-500">× {i.qty}</span></span>
              <span className="ltr-iso font-semibold">{f(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-1 border-t border-navy/10 pt-3">
          <div className="flex justify-between"><dt>{t.common.subtotal}</dt><dd className="ltr-iso">{f(r.subtotal)}</dd></div>
          <div className="flex justify-between"><dt>{t.checkout.deliveryFee}</dt><dd className="ltr-iso">{f(r.delivery_fee)}</dd></div>
          <div className="flex justify-between font-display text-xl font-bold"><dt>{t.checkout.totalToPay}</dt><dd className="ltr-iso">{f(r.total)}</dd></div>
        </dl>
      </div>

      {r.deposit_required && (
        <div role="note" className="rounded-2xl bg-yellow-100 p-4 text-start">
          <p className="font-display font-bold">{t.success.depositTitle}</p>
          <p className="text-sm">{fmt(t.success.depositText, { amount: f(r.deposit_amount) })}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {whatsapp && (
          <>
            <a href={whatsappLink(whatsapp, waText)} target="_blank" rel="noopener noreferrer" className="btn min-h-14 bg-[#1FAF54] text-lg text-white shadow-soft hover:bg-[#188a43]">
              <WhatsAppIcon size={24} /> {t.success.whatsapp}
            </a>
            <p className="text-sm text-navy-500">{t.success.whatsappHint}</p>
          </>
        )}
        <Link href={href('/track')} className="btn-ghost">{t.success.track}</Link>
        <Link href={href('/shop')} className="btn-primary">{t.common.continueShopping}</Link>
      </div>
    </div>
  );
}
