import { Mascot } from './Mascot';
import type { Lang } from '@/lib/types';

/** Mascot + wordmark. Prominent in the header and footer. */
export function Logo({ lang, size = 'md' }: { lang: Lang; size?: 'md' | 'lg' }) {
  const star = size === 'lg' ? 56 : 44;
  return (
    <span className="inline-flex items-center gap-2.5">
      <Mascot size={star} className="shrink-0 transition-transform duration-300 group-hover:rotate-12" />
      <span className="leading-none">
        <span
          className={`block font-display font-bold text-pink-600 ${size === 'lg' ? 'text-3xl' : 'text-2xl'}`}
        >
          {lang === 'ar' ? 'عالم حسن' : "Hassan's"}
        </span>
        <span className="mt-0.5 block font-display text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-navy">
          {lang === 'ar' ? 'للألعاب' : 'Toys World'}
        </span>
      </span>
    </span>
  );
}
