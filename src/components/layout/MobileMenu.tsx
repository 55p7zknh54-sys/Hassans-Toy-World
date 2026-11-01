'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { CloseIcon, MenuIcon, PackageIcon } from '@/components/Icons';
import { Mascot } from '@/components/brand/Mascot';
import { useI18n } from '@/components/I18nProvider';
import { NavLinks, type NavItem } from './NavLinks';
import { LanguageSwitcher } from './LanguageSwitcher';

export function MobileMenu({ items }: { items: NavItem[] }) {
  const { t, href } = useI18n();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid h-12 w-12 place-items-center rounded-full bg-white text-navy shadow-soft lg:hidden"
        aria-label={t.common.menu}
        aria-expanded={open}
        aria-controls="mobile-menu"
      >
        <MenuIcon />
      </button>
      {open && (
        <div id="mobile-menu" role="dialog" aria-modal="true" aria-label={t.common.menu} className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-navy/50" aria-label={t.common.close} onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 start-0 flex w-[88%] max-w-sm animate-fade-up flex-col gap-4 overflow-y-auto bg-cream p-5 shadow-lift">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-display text-lg font-bold text-pink-600">
                <Mascot size={36} /> {t.brand.name}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-full bg-white text-navy shadow-soft"
                aria-label={t.common.close}
              >
                <CloseIcon />
              </button>
            </div>
            <nav aria-label={t.nav.mainNav}>
              <NavLinks
                items={items}
                className="flex flex-col gap-1"
                linkClassName="block rounded-2xl px-4 py-3.5 font-display text-lg font-semibold"
              />
            </nav>
            <Link
              href={href('/track')}
              className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 font-display font-semibold text-navy shadow-soft"
            >
              <PackageIcon /> {t.nav.track}
            </Link>
            <div className="mt-auto">
              <LanguageSwitcher variant="wide" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
