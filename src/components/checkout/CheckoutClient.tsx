'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { Mascot } from '@/components/brand/Mascot';
import { AlertIcon } from '@/components/Icons';
import { useCart } from '@/components/cart/CartProvider';
import { useCartProducts } from '@/components/cart/useCartProducts';
import { useI18n } from '@/components/I18nProvider';
import { fmt } from '@/i18n';
import { initialPlaceOrder } from '@/lib/action-types';
import { placeOrderAction } from '@/lib/actions/store';
import { formatIQD } from '@/lib/format';
import { computeTotals } from '@/lib/pricing';
import { pick, type DeliveryFee } from '@/lib/types';
import { validateCheckout, type CheckoutErrors } from '@/lib/validation';
import { OrderSuccess } from './OrderSuccess';

type Form = { name: string; phone: string; governorate: string; city: string; address: string; notes: string };
const EMPTY: Form = { name: '', phone: '', governorate: '', city: '', address: '', notes: '' };

export function CheckoutClient({ fees, whatsapp, ordersOpen }: { fees: DeliveryFee[]; whatsapp: string | null; ordersOpen: boolean }) {
  const { t, lang, href } = useI18n();
  const { clear } = useCart();
  const { items, loading, notices } = useCartProducts();
  const [state, formAction, pending] = useActionState(placeOrderAction, initialPlaceOrder);
  const [form, setForm] = useState<Form>(EMPTY);
  const [step, setStep] = useState<'details' | 'review'>('details');
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const cleared = useRef(false);

  const fee = fees.find((f) => f.code === form.governorate) ?? null;
  const totals = useMemo(() => computeTotals(items.map((i) => ({ unit: i.unit, qty: i.qty })), fee ? fee.fee_iqd : null), [items, fee]);
  const f = (n: number) => formatIQD(n, lang);

  useEffect(() => {
    if (state.status === 'success' && !cleared.current) {
      cleared.current = true;
      clear();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (state.status === 'error' && state.code === 'validation' && state.errors) {
      setErrors(state.errors);
      setStep('details');
    }
  }, [state, clear]);

  if (state.status === 'success') return <OrderSuccess receipt={state.receipt} whatsapp={whatsapp} />;

  if (!ordersOpen) {
    return <p role="alert" className="card p-8 text-center text-lg font-semibold">{t.checkout.ordersClosed}</p>;
  }
  if (loading) return <div className="card h-80" aria-busy="true" />;
  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-4 p-12 text-center">
        <Mascot size={96} />
        <p className="text-lg">{t.checkout.emptyCart}</p>
        <Link href={href('/shop')} className="btn-primary">{t.checkout.goShopping}</Link>
      </div>
    );
  }

  const set = (k: keyof Form) => (e: { target: { value: string } }) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };
  const errMsg = (k: keyof CheckoutErrors) => (errors[k] ? t.checkout.errors[errors[k] as keyof typeof t.checkout.errors] : null);
  const field = (k: keyof Form, label: string, props: Record<string, unknown> = {}) => (
    <div>
      <label htmlFor={`co-${k}`} className="field-label">{label}</label>
      <input id={`co-${k}`} name={k} value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `co-${k}-err` : undefined} className="field" {...props} />
      {errors[k] && <p id={`co-${k}-err`} className="field-error">{errMsg(k)}</p>}
    </div>
  );

  const goReview = () => {
    const v = validateCheckout(form);
    setErrors(v.errors);
    if (v.ok) {
      setStep('review');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const serverMsg =
    state.status === 'error' && state.code !== 'validation'
      ? fmt(((t.checkout.serverErrors as Record<string, string>)[state.code] ?? t.checkout.serverErrors.generic), (state.params ?? {}) as Record<string, string | number>)
      : null;
  const cartJson = JSON.stringify(items.map((i) => ({ product_id: i.product.id, quantity: i.qty })));

  return (
    <div className="grid items-start gap-6 lg:grid-cols-5">
      <form action={formAction} className="space-y-5 lg:col-span-3" noValidate>
        <ol className="flex items-center gap-2 text-sm font-semibold" aria-label={t.checkout.title}>
          {[t.checkout.stepDetails, t.checkout.stepReview, t.checkout.stepDone].map((s, n) => {
            const active = (step === 'details' && n === 0) || (step === 'review' && n === 1);
            return (
              <li key={s} aria-current={active ? 'step' : undefined} className={`flex items-center gap-2 rounded-full px-4 py-2 ${active ? 'bg-pink-600 text-white' : 'bg-white text-navy-500'}`}>
                <span className="ltr-iso">{n + 1}</span> {s}
              </li>
            );
          })}
        </ol>

        {serverMsg && (
          <div role="alert" className="flex items-start gap-3 rounded-2xl bg-pink-100 p-4 font-semibold text-pink-700">
            <AlertIcon className="mt-0.5 shrink-0" size={20} /> <p>{serverMsg}</p>
          </div>
        )}
        {notices.length > 0 && <p role="status" className="rounded-2xl bg-yellow-100 p-3 text-sm font-semibold">{notices.join(' ')}</p>}

        <input type="hidden" name="cart" value={cartJson} />
        <input type="hidden" name="language" value={lang} />
        <div className="absolute -start-[9999px]" aria-hidden="true"><label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label></div>

        <fieldset hidden={step === 'review'} className="card space-y-4 p-5 sm:p-6">
          <legend className="sr-only">{t.checkout.detailsTitle}</legend>
          <h2 className="text-xl">{t.checkout.detailsTitle}</h2>
          {field('name', t.checkout.fullName, { autoComplete: 'name', placeholder: t.checkout.fullNamePh })}
          <div>
            {field('phone', t.checkout.phone, { type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: t.checkout.phonePh, dir: 'ltr' })}
            {!errors.phone && <p className="mt-1.5 text-sm text-navy-500">{t.checkout.phoneHint}</p>}
          </div>
          <div>
            <label htmlFor="co-governorate" className="field-label">{t.checkout.governorate}</label>
            <select id="co-governorate" name="governorate" value={form.governorate} onChange={set('governorate')} aria-invalid={!!errors.governorate} className="field">
              <option value="">{t.checkout.selectGovernorate}</option>
              {fees.map((g) => <option key={g.code} value={g.code}>{pick(g, 'name', lang)}</option>)}
            </select>
            {errors.governorate && <p className="field-error">{errMsg('governorate')}</p>}
          </div>
          {field('city', t.checkout.city, { autoComplete: 'address-level2', placeholder: t.checkout.cityPh })}
          <div>
            <label htmlFor="co-address" className="field-label">{t.checkout.address}</label>
            <textarea id="co-address" name="address" rows={3} value={form.address} onChange={set('address')} placeholder={t.checkout.addressPh} aria-invalid={!!errors.address} className="field" />
            {errors.address && <p className="field-error">{errMsg('address')}</p>}
          </div>
          <div>
            <label htmlFor="co-notes" className="field-label">{t.checkout.notes} <span className="font-normal text-navy-500">({t.common.optional})</span></label>
            <textarea id="co-notes" name="notes" rows={2} maxLength={500} value={form.notes} onChange={set('notes')} placeholder={t.checkout.notesPh} className="field" />
          </div>
          <button type="button" onClick={goReview} className="btn-primary min-h-14 w-full text-lg">{t.checkout.reviewOrder}</button>
        </fieldset>

        {step === 'review' && (
          <div className="card space-y-4 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl">{t.checkout.deliveryTo}</h2>
                <p className="mt-1 font-semibold">{form.name}</p>
                <p className="ltr-iso text-navy-700">{form.phone}</p>
                <p className="text-navy-700">{fee ? pick(fee, 'name', lang) : ''} — {form.city}</p>
                <p className="text-navy-700">{form.address}</p>
                {form.notes && <p className="mt-1 text-sm text-navy-500">{form.notes}</p>}
              </div>
              <button type="button" onClick={() => setStep('details')} className="btn-ghost btn-sm shrink-0">{t.checkout.editDetails}</button>
            </div>
            <p className="rounded-2xl bg-blue-100 p-3 text-sm">{t.checkout.cod} {t.checkout.pendingNote}</p>
            <button type="submit" disabled={pending} className="btn-primary min-h-14 w-full text-lg">{pending ? t.checkout.placing : t.checkout.placeOrder}</button>
          </div>
        )}
      </form>

      <aside className="card space-y-4 p-5 sm:p-6 lg:sticky lg:top-32 lg:col-span-2">
        <h2 className="text-xl">{t.checkout.summary}</h2>
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.product.id} className="flex items-center gap-3">
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream-dark">{i.product.image && <Image src={i.product.image} alt="" fill sizes="56px" className="object-cover" />}</span>
              <span className="flex-1 text-sm font-semibold leading-snug">{i.name} <span className="ltr-iso text-navy-500">× {i.qty}</span></span>
              <span className="ltr-iso text-sm font-bold">{f(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-navy/10 pt-4">
          <div className="flex justify-between"><dt>{t.common.subtotal}</dt><dd className="ltr-iso font-semibold">{f(totals.subtotal)}</dd></div>
          <div className="flex justify-between"><dt>{t.checkout.deliveryFee}</dt><dd className="ltr-iso font-semibold">{totals.deliveryFee == null ? <span className="text-sm text-navy-500">{t.checkout.chooseGovFirst}</span> : f(totals.deliveryFee)}</dd></div>
          <div className="flex items-baseline justify-between border-t border-navy/10 pt-3 font-display text-xl font-bold"><dt>{t.checkout.totalToPay}</dt><dd className="ltr-iso text-pink-700">{totals.total == null ? '—' : f(totals.total)}</dd></div>
        </dl>
        <p className="text-sm text-navy-500">{t.checkout.cod}</p>
      </aside>
    </div>
  );
}
