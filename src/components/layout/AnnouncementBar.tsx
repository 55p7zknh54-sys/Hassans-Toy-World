import { getDict } from '@/i18n';
import type { Lang } from '@/lib/types';

/** Top strip: delivery, cash on delivery, new products. Scrolls on phones, static on larger screens. */
export function AnnouncementBar({ lang }: { lang: Lang }) {
  const msgs = getDict(lang).announce;
  return (
    <div className="bg-navy text-sm font-semibold text-white">
      <div className="container-page hidden items-center justify-center gap-10 py-2 md:flex">
        {msgs.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
      <div className="overflow-hidden py-2 md:hidden" aria-label={msgs.join('. ')}>
        <div className="flex w-max animate-marquee gap-12 whitespace-nowrap ps-12" aria-hidden="true">
          {[...msgs, ...msgs].map((m, i) => (
            <span key={i}>{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
