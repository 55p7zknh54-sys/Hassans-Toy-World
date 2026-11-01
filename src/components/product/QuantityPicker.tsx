'use client';

import { MinusIcon, PlusIcon } from '@/components/Icons';
import { useI18n } from '@/components/I18nProvider';

/** − [ 2 ] + control with big touch targets. */
export function QuantityPicker({
  value,
  onChange,
  max,
  min = 1,
  compact = false,
}: {
  value: number;
  onChange: (n: number) => void;
  max: number;
  min?: number;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const btn = `grid place-items-center rounded-full bg-white text-navy shadow-soft transition active:scale-90 disabled:opacity-40 ${compact ? 'h-10 w-10' : 'h-12 w-12'}`;
  return (
    <div className="inline-flex items-center gap-2" role="group" aria-label={t.common.quantity}>
      <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label={t.common.decrease}>
        <MinusIcon size={18} />
      </button>
      <output className={`ltr-iso text-center font-display font-bold ${compact ? 'min-w-8 text-base' : 'min-w-10 text-xl'}`} aria-live="polite">
        {value}
      </output>
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label={t.common.increase}>
        <PlusIcon size={18} />
      </button>
    </div>
  );
}
