'use client';

import { useActionState, useState } from 'react';
import { StarIcon } from '@/components/Icons';
import { useI18n } from '@/components/I18nProvider';
import { submitReviewAction } from '@/lib/actions/store';
import { initialReview } from '@/lib/action-types';

/** Real review form: saved as "pending" in the database and shown only after an admin approves it. */
export function ReviewForm({ productId }: { productId: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(submitReviewAction, initialReview);
  const [rating, setRating] = useState(0);
  const errs = t.product.reviewErrors as Record<string, string>;

  if (state.status === 'success') {
    return (
      <p role="status" className="rounded-2xl bg-blue-100 p-4 font-semibold text-navy">
        {t.product.thanks}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="rating" value={rating || ''} />
      {/* honeypot: real people never see or fill this */}
      <div className="absolute -start-[9999px]" aria-hidden="true">
        <label>Website <input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <fieldset>
        <legend className="field-label">{t.product.yourRating}</legend>
        <div className="flex gap-1" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} / 5`}
              onClick={() => setRating(n)}
              className={`grid h-12 w-12 place-items-center rounded-full transition active:scale-90 ${n <= rating ? 'text-yellow-600' : 'text-navy-100 hover:text-yellow'}`}
            >
              <StarIcon size={32} filled />
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="rv-name">{t.product.yourName}</label>
          <input id="rv-name" name="name" required minLength={2} maxLength={60} autoComplete="name" className="field" />
        </div>
        <div>
          <label className="field-label" htmlFor="rv-phone">{t.product.yourPhone}</label>
          <input id="rv-phone" name="phone" type="tel" inputMode="tel" required autoComplete="tel" dir="ltr" placeholder={t.checkout.phonePh} className="field" aria-describedby="rv-phone-hint" />
          <p id="rv-phone-hint" className="mt-1 text-xs text-navy-500">{t.product.phoneHint}</p>
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="rv-body">{t.product.yourReview}</label>
        <textarea id="rv-body" name="body" required minLength={3} maxLength={1000} rows={4} className="field" />
      </div>

      {state.status === 'error' && (
        <p role="alert" className="field-error">{errs[state.code] ?? errs.generic}</p>
      )}
      <button type="submit" disabled={pending} className="btn-navy">
        {pending ? t.product.sending : t.product.submitReview}
      </button>
    </form>
  );
}
