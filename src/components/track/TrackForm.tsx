'use client';

import { useActionState } from 'react';
import { useI18n } from '@/components/I18nProvider';
import { fmt } from '@/i18n';
import { initialTrack } from '@/lib/action-types';
import { trackOrderAction } from '@/lib/actions/store';
import { formatDate, formatIQD } from '@/lib/format';

const STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const;

export function TrackForm() {
  const { t, lang } = useI18n();
  const [state, action, pending] = useActionState(trackOrderAction, initialTrack);
  const f = (n: number) => formatIQD(n, lang);
  const status = t.status as Record<string, string>;
  const help = t.track.statusHelp as Record<string, string>;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <form action={action} className="card space-y-4 p-6">
        <div>
          <label htmlFor="tr-order" className="field-label">{t.track.orderNumber}</label>
          <input id="tr-order" name="order" required dir="ltr" placeholder={t.track.orderNumberPh} autoCapitalize="characters" className="field" />
        </div>
        <div>
          <label htmlFor="tr-phone" className="field-label">{t.track.phone}</label>
          <input id="tr-phone" name="phone" type="tel" inputMode="tel" required dir="ltr" placeholder={t.checkout.phonePh} className="field" />
        </div>
        <button type="submit" disabled={pending} className="btn-primary min-h-14 w-full text-lg">{pending ? t.track.searching : t.track.button}</button>
      </form>

      {(state.status === 'not_found' || state.status === 'error') && (
        <p role="alert" className="rounded-2xl bg-pink-100 p-4 font-semibold text-pink-700">
          {state.status === 'error' ? t.checkout.serverErrors.not_configured : t.track.notFound}
        </p>
      )}

      {state.status === 'found' && (
        <div className="card space-y-5 p-6" role="status">
          <div>
            <p className="ltr-iso font-display text-2xl font-bold text-pink-700">{state.order.number}</p>
            <p className="text-sm text-navy-500">{fmt(t.track.placedOn, { date: formatDate(state.order.created_at, lang) })}</p>
          </div>
          {state.order.state === 'cancelled' || state.order.state === 'returned' ? (
            <p className="chip bg-navy-100 px-4 py-2 text-base text-navy">{status[state.order.state]}</p>
          ) : (
            <ol className="flex items-start justify-between gap-1">
              {STEPS.map((s, n) => {
                const at = STEPS.indexOf(state.order.state as (typeof STEPS)[number]);
                const done = n <= at;
                return (
                  <li key={s} className="flex flex-1 flex-col items-center gap-1.5 text-center" aria-current={n === at ? 'step' : undefined}>
                    <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-bold ${done ? 'bg-pink-600 text-white' : 'bg-navy-100 text-navy-500'}`}>{done ? '✓' : n + 1}</span>
                    <span className={`text-xs font-semibold ${n === at ? 'text-pink-700' : 'text-navy-500'}`}>{status[s]}</span>
                  </li>
                );
              })}
            </ol>
          )}
          <p className="font-semibold">{help[state.order.state]}</p>
          {state.order.deposit_required && !state.order.deposit_received && ['pending', 'confirmed'].includes(state.order.state) && (
            <p className="rounded-2xl bg-yellow-100 p-3 text-sm font-semibold">{fmt(t.track.depositWaiting, { amount: f(state.order.deposit_amount) })}</p>
          )}
          <ul className="divide-y divide-navy/10 text-sm">
            {state.order.items.map((i, n) => (
              <li key={n} className="flex justify-between gap-3 py-2"><span>{lang === 'ar' ? i.name_ar : i.name_en} × {i.quantity}</span><span className="ltr-iso font-semibold">{f(i.line_total)}</span></li>
            ))}
          </ul>
          <p className="flex justify-between font-display text-lg font-bold"><span>{t.track.total}</span><span className="ltr-iso">{f(state.order.total)}</span></p>
        </div>
      )}
    </div>
  );
}
