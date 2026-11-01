import type { Metadata, Viewport } from 'next';
import { Baloo_Bhaijaan_2, Cairo, Fredoka, Nunito } from 'next/font/google';
import { notFound } from 'next/navigation';
import '@/app/globals.css';
import { I18nProvider } from '@/components/I18nProvider';
import { CartProvider } from '@/components/cart/CartProvider';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat';
import { dirOf, getDict } from '@/i18n';
import { getCategories, getSettings } from '@/lib/data';
import { alternatesFor, siteUrl } from '@/lib/site';
import { isDemoMode } from '@/lib/supabase/clients';
import { isLang } from '@/lib/types';

const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const baloo = Baloo_Bhaijaan_2({ subsets: ['arabic', 'latin'], variable: '--font-display-ar', display: 'swap' });
const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-body-ar', display: 'swap' });

export const revalidate = 60;
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ar' }];
}

export const viewport: Viewport = { themeColor: '#FF6B9D', width: 'device-width', initialScale: 1 };

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = getDict(lang);
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${t.brand.name} — ${t.brand.slogan}`, template: `%s | ${t.brand.name}` },
    description: t.brand.tagline,
    alternates: alternatesFor(lang),
    openGraph: {
      type: 'website',
      siteName: t.brand.name,
      locale: lang === 'ar' ? 'ar_IQ' : 'en_US',
      title: `${t.brand.name} — ${t.brand.slogan}`,
      description: t.brand.tagline,
      images: [{ url: '/og.png', width: 1200, height: 630, alt: t.brand.name }],
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const t = getDict(lang);
  const [categories, settings] = await Promise.all([getCategories(), getSettings()]);

  return (
    <html
      lang={lang}
      dir={dirOf(lang)}
      className={`${fredoka.variable} ${nunito.variable} ${baloo.variable} ${cairo.variable}`}
    >
      <body>
        <I18nProvider lang={lang} dict={t}>
          <CartProvider>
            <a
              href="#main"
              className="sr-only z-50 rounded-full bg-navy px-5 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
            >
              {t.common.skipToContent}
            </a>
            <AnnouncementBar lang={lang} />
            {isDemoMode() && (
              <p className="bg-yellow px-4 py-2 text-center text-sm font-semibold text-navy" role="note">
                {t.demo.banner}
              </p>
            )}
            <Header lang={lang} categories={categories} />
            <main id="main">{children}</main>
            <Footer lang={lang} categories={categories} settings={settings} />
            <WhatsAppFloat lang={lang} number={settings.whatsapp_number} />
          </CartProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
