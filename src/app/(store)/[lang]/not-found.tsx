import Link from 'next/link';
import { Mascot } from '@/components/brand/Mascot';
import { en } from '@/i18n/en';
import { ar } from '@/i18n/ar';

/** The 404 page can't know the language, so it shows both. */
export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center gap-4 py-20 text-center">
      <Mascot size={140} sparkles className="animate-wiggle" />
      <h1 className="text-3xl sm:text-4xl">{en.notFound.title}</h1>
      <p className="text-navy-500">{en.notFound.text}</p>
      <p lang="ar" dir="rtl" className="text-navy-500">{ar.notFound.title} — {ar.notFound.text}</p>
      <div className="mt-2 flex gap-3">
        <Link href="/en/shop" className="btn-primary">{en.notFound.cta}</Link>
        <Link href="/ar/shop" className="btn-ghost" lang="ar">{ar.notFound.cta}</Link>
      </div>
    </div>
  );
}
