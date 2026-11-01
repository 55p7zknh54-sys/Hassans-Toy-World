import type { Metadata } from 'next';
import { Hero } from '@/components/home/Hero';
import { CategoryGrid, ProductSection, PromoBanner, ReviewsSection, WhyShop } from '@/components/home/Sections';
import { getDict, localePath } from '@/i18n';
import { getCategories, getProducts, getRecentReviews, getSettings } from '@/lib/data';
import { alternatesFor, siteUrl } from '@/lib/site';
import type { Lang } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = (await params).lang as Lang;
  const t = getDict(lang);
  return { title: { absolute: `${t.brand.name} — ${t.brand.slogan}` }, description: t.brand.tagline, alternates: alternatesFor(lang) };
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = (await params).lang as Lang;
  const t = getDict(lang);
  const [products, categories, settings, reviews] = await Promise.all([
    getProducts(),
    getCategories(),
    getSettings(),
    getRecentReviews(6),
  ]);
  const newest = [...products].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 8);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: t.brand.name,
    slogan: t.brand.slogan,
    url: `${siteUrl()}/${lang}`,
    areaServed: 'IQ',
    currenciesAccepted: 'IQD',
    paymentAccepted: 'Cash',
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero lang={lang} products={products} />
      {products.length === 0 && (
        <p className="container-page py-16 text-center text-lg text-navy-500">{t.home.allProductsEmpty}</p>
      )}
      <ProductSection
        title={t.home.trendingTitle}
        sub={t.home.trendingSub}
        products={products.filter((p) => p.featured).slice(0, 8)}
        lang={lang}
        href={localePath(lang, '/shop?sort=popular')}
        eager={4}
      />
      <CategoryGrid categories={categories} lang={lang} />
      <ProductSection
        title={t.home.bestTitle}
        sub={t.home.bestSub}
        products={products.filter((p) => p.best_seller).slice(0, 8)}
        lang={lang}
        href={localePath(lang, '/best-sellers')}
      />
      <ProductSection title={t.home.newTitle} sub={t.home.newSub} products={newest} lang={lang} href={localePath(lang, '/new-arrivals')} />
      <PromoBanner lang={lang} settings={settings} />
      <WhyShop lang={lang} />
      <ReviewsSection lang={lang} reviews={reviews} />
    </>
  );
}
