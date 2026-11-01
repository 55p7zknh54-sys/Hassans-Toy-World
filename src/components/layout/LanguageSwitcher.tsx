'use client';

import { usePathname, useRouter } from 'next/navigation';
import { GlobeIcon } from '@/components/Icons';
import { useI18n } from '@/components/I18nProvider';
import { switchLangPath } from '@/i18n';

/** Switches between /en/... and /ar/... on the same page and remembers the choice. */
export function LanguageSwitcher({ variant = 'pill' }: { variant?: 'pill' | 'wide' }) {
  const { lang, t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const target = lang === 'ar' ? 'en' : 'ar';

  const go = () => {
    try {
      document.cookie = `hw_lang=${target}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      /* ignore */
    }
    router.push(switchLangPath(pathname, target) + window.location.search);
  };

  return (
    <button
      type="button"
      onClick={go}
      lang={target}
      className={
        variant === 'wide'
          ? 'flex w-full items-center justify-center gap-2 rounded-2xl bg-navy px-4 py-3.5 font-display text-lg font-semibold text-white'
          : 'inline-flex h-12 items-center gap-1.5 rounded-full bg-white px-4 font-display text-sm font-semibold text-navy shadow-soft transition hover:bg-navy-100/60'
      }
    >
      <GlobeIcon size={18} />
      {t.common.switchLanguage}
    </button>
  );
}
