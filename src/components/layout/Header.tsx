import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { SearchIcon } from '@/components/Icons';
import { getDict, localePath } from '@/i18n';
import { pick, type Category, type Lang } from '@/lib/types';
import { NavLinks, type NavItem } from './NavLinks';
import { MobileMenu } from './MobileMenu';
import { CartButton } from './CartButton';
import { LanguageSwitcher } from './LanguageSwitcher';

export function SearchForm({ lang, className }: { lang: Lang; className?: string }) {
  const t = getDict(lang);
  return (
    <form role="search" action={localePath(lang, '/shop')} method="get" className={className}>
      <label htmlFor={`q-${className ? 'm' : 'd'}`} className="sr-only">
        {t.common.search}
      </label>
      <div className="relative">
        <input
          id={`q-${className ? 'm' : 'd'}`}
          name="q"
          type="search"
          enterKeyHint="search"
          placeholder={t.nav.searchPlaceholder}
          className="field !min-h-12 !rounded-full !ps-12"
        />
        <button
          type="submit"
          className="absolute inset-y-0 start-1 my-auto grid h-10 w-10 place-items-center rounded-full text-navy-500 hover:text-pink-600"
          aria-label={t.common.search}
        >
          <SearchIcon size={20} />
        </button>
      </div>
    </form>
  );
}

export function Header({ lang, categories }: { lang: Lang; categories: Category[] }) {
  const t = getDict(lang);
  const items: NavItem[] = [
    { href: localePath(lang), label: t.nav.home },
    { href: localePath(lang, '/shop'), label: t.nav.shop },
    ...categories.slice(0, 4).map((c) => ({
      href: localePath(lang, `/category/${c.slug}`),
      label: pick(c, 'name', lang),
    })),
    { href: localePath(lang, '/new-arrivals'), label: t.nav.newArrivals },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-navy/5 bg-cream/90 backdrop-blur-md">
      <div className="container-page flex items-center gap-3 py-3">
        <Link href={localePath(lang)} className="group shrink-0 rounded-2xl" aria-label={t.brand.name}>
          <Logo lang={lang} />
        </Link>

        <SearchForm lang={lang} className="mx-auto hidden w-full max-w-md md:block lg:max-w-sm xl:max-w-md" />

        <div className="ms-auto flex items-center gap-2 md:ms-0">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <CartButton />
          <MobileMenu items={items} />
        </div>
      </div>

      <nav aria-label={t.nav.mainNav} className="hidden border-t border-navy/5 lg:block">
        <div className="container-page">
          <NavLinks
            items={items}
            className="flex items-center justify-center gap-1 py-2"
            linkClassName="block rounded-full px-4 py-2 font-display text-[0.95rem] font-semibold transition"
          />
        </div>
      </nav>

      <div className="container-page pb-3 md:hidden">
        <SearchForm lang={lang} className="w-full" />
      </div>
    </header>
  );
}
