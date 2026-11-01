import Image from 'next/image';
import Link from 'next/link';
import { Mascot } from '@/components/brand/Mascot';
import { CashIcon, TruckIcon } from '@/components/Icons';
import { getDict, localePath } from '@/i18n';
import { pick, type Lang, type Product } from '@/lib/types';

const SLOTS = [
  'start-0 top-6 w-[52%] -rotate-6',
  'end-0 top-0 w-[46%] rotate-6',
  'start-[22%] bottom-0 w-[52%] rotate-2',
];

export function Hero({ lang, products }: { lang: Lang; products: Product[] }) {
  const t = getDict(lang);
  const picks = [...products.filter((p) => p.featured), ...products]
    .filter((p, i, a) => p.images[0] && a.findIndex((x) => x.id === p.id) === i)
    .slice(0, 3);

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-pink-100 via-cream to-blue-100" aria-hidden="true" />
      <div className="absolute -start-24 top-10 -z-10 h-72 w-72 rounded-full bg-yellow/40 blur-3xl" aria-hidden="true" />
      <div className="absolute -end-16 bottom-0 -z-10 h-80 w-80 rounded-full bg-purple/30 blur-3xl" aria-hidden="true" />

      <div className="container-page grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-2 lg:py-20">
        <div className="animate-fade-up text-center lg:text-start">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 font-display text-sm font-semibold text-pink-700 shadow-soft">
            <Mascot size={26} /> {t.hero.eyebrow}
          </p>
          <h1 className="text-balance text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl">{t.hero.title}</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-navy-700 lg:mx-0">{t.hero.subtitle}</p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row lg:justify-start">
            <Link href={localePath(lang, '/shop')} className="btn-primary min-h-14 px-10 text-lg tracking-wide">
              {t.common.shopNow}
            </Link>
            <Link href={localePath(lang, '/new-arrivals')} className="btn-ghost min-h-14 px-8 text-lg">
              {t.hero.secondary}
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
            <li className="chip bg-white px-4 py-2 text-sm text-navy shadow-soft"><CashIcon size={18} className="text-pink-600" /> {t.hero.badge1}</li>
            <li className="chip bg-white px-4 py-2 text-sm text-navy shadow-soft"><TruckIcon size={18} className="text-blue-600" /> {t.hero.badge2}</li>
          </ul>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-md sm:max-w-lg" aria-hidden={picks.length === 0}>
          {picks.length === 0 ? (
            <Mascot size={320} sparkles className="mx-auto animate-float" />
          ) : (
            <>
              {picks.map((p, i) => (
                <Link
                  key={p.id}
                  href={localePath(lang, `/product/${p.slug}`)}
                  className={`absolute ${SLOTS[i]} aspect-square overflow-hidden rounded-blob border-4 border-white bg-white shadow-lift transition duration-300 hover:z-10 hover:scale-105`}
                  aria-label={pick(p, 'name', lang)}
                >
                  <Image src={p.images[0]} alt="" fill priority={i === 0} sizes="(min-width: 1024px) 250px, 40vw" className="object-cover" />
                </Link>
              ))}
              <Mascot size={96} sparkles mood="wink" className="absolute -bottom-2 end-2 animate-float drop-shadow-lg sm:end-6" />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
