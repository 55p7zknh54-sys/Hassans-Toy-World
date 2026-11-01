import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronIcon, WhatsAppIcon } from '@/components/Icons';
import { ProductGrid } from '@/components/product/ProductCard';
import { BuyBox } from '@/components/product/BuyBox';
import { ProductGallery } from '@/components/product/ProductGallery';
import { PriceTag, Stars, StockBadge } from '@/components/product/parts';
import { ReviewForm } from '@/components/product/ReviewForm';
import { fmt, getDict, localePath } from '@/i18n';
import { getCategories, getProductBySlug, getProductReviews, getProducts, getSettings } from '@/lib/data';
import { formatDate } from '@/lib/format';
import { buildSupportMessage } from '@/lib/order-message';
import { whatsappLink } from '@/lib/phone';
import { effectivePrice, isOnSale } from '@/lib/pricing';
import { absoluteUrl, alternatesFor, siteUrl } from '@/lib/site';
import { isDemoMode } from '@/lib/supabase/clients';
import { pick, type Lang } from '@/lib/types';

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  const name = pick(p, 'name', lang as Lang);
  const desc = pick(p, 'description', lang as Lang).slice(0, 160);
  return {
    title: name,
    description: desc,
    alternates: alternatesFor(lang as Lang, `/product/${slug}`),
    openGraph: { type: 'website', title: name, description: desc, images: p.images[0] ? [{ url: absoluteUrl(p.images[0]) }] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { lang: l, slug } = await params;
  const lang = l as Lang;
  const t = getDict(lang);
  const p = await getProductBySlug(slug);
  if (!p) notFound();

  const [all, categories, reviews, settings] = await Promise.all([getProducts(), getCategories(), getProductReviews(p.id), getSettings()]);
  const category = categories.find((c) => c.slug === p.category_slug);
  const name = pick(p, 'name', lang);
  const related = [
    ...all.filter((x) => x.id !== p.id && x.category_slug === p.category_slug),
    ...all.filter((x) => x.id !== p.id && x.category_slug !== p.category_slug),
  ].slice(0, 4);
  const url = `${siteUrl()}/${lang}/product/${p.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: pick(p, 'description', lang),
    image: p.images.map(absoluteUrl),
    sku: p.slug,
    brand: { '@type': 'Brand', name: t.brand.name },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'IQD',
      price: effectivePrice(p),
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    ...(p.rating_count > 0 && p.rating_avg != null
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rating_avg, reviewCount: p.rating_count } }
      : {}),
  };

  return (
    <div className="container-page py-6 sm:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-sm text-navy-500">
        <Link href={localePath(lang)} className="hover:text-pink-700">{t.nav.home}</Link>
        <ChevronIcon size={14} className="rtl-flip" />
        <Link href={localePath(lang, '/shop')} className="hover:text-pink-700">{t.nav.shop}</Link>
        {category && (
          <>
            <ChevronIcon size={14} className="rtl-flip" />
            <Link href={localePath(lang, `/category/${category.slug}`)} className="hover:text-pink-700">{pick(category, 'name', lang)}</Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={p.images} alt={name} />

        <div className="space-y-5">
          {category && <p className="chip bg-purple-100 text-purple-600">{pick(category, 'name', lang)}</p>}
          <h1 className="text-3xl sm:text-4xl">{name}</h1>
          {p.rating_count > 0 && p.rating_avg != null && (
            <p className="flex items-center gap-2 text-sm text-navy-500">
              <Stars value={p.rating_avg} label={fmt(t.product.outOf5, { n: p.rating_avg })} />
              <span>{p.rating_count === 1 ? t.product.reviewCountOne : fmt(t.product.reviewCount, { n: p.rating_count })}</span>
            </p>
          )}
          <PriceTag p={p} lang={lang} size="lg" />
          {isOnSale(p) && p.sale_ends_at && (
            <p className="text-sm font-semibold text-pink-700">{fmt(t.product.saleEnds, { date: formatDate(p.sale_ends_at, lang) })}</p>
          )}
          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
            <dt className="font-semibold text-navy-500">{t.common.availability}</dt>
            <dd><StockBadge stock={p.stock} lang={lang} /></dd>
            {category && (
              <>
                <dt className="font-semibold text-navy-500">{t.common.category}</dt>
                <dd>{pick(category, 'name', lang)}</dd>
              </>
            )}
          </dl>

          <div className="card p-5">
            <BuyBox productId={p.id} stock={p.stock} />
          </div>

          {settings.whatsapp_number && (
            <a
              href={whatsappLink(settings.whatsapp_number, buildSupportMessage(lang, name))}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost w-full sm:w-auto"
            >
              <WhatsAppIcon size={20} className="text-[#1FAF54]" /> {t.product.askWhatsApp}
            </a>
          )}

          <section aria-labelledby="desc-h">
            <h2 id="desc-h" className="mb-2 text-xl">{t.product.description}</h2>
            <p className="whitespace-pre-line leading-relaxed text-navy-700">{pick(p, 'description', lang)}</p>
          </section>
        </div>
      </div>

      <section className="mt-16" aria-labelledby="reviews-h">
        <h2 id="reviews-h" className="section-title mb-6">{t.product.reviewsTitle}</h2>
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            {reviews.length === 0 ? (
              <p className="card p-6 text-navy-500">{t.product.noReviews}</p>
            ) : (
              <ul className="space-y-4">
                {reviews.map((r) => (
                  <li key={r.id} className="card space-y-2 p-5">
                    <Stars value={r.rating} />
                    <p>“{r.body}”</p>
                    <p className="text-sm text-navy-500">
                      <span className="font-display font-bold text-navy">{r.reviewer_name}</span> · {formatDate(r.created_at, lang)}
                      {r.verified_purchase && <span className="ms-2 font-semibold text-blue-600">✓ {t.product.verified}</span>}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card p-6">
            <h3 className="mb-1 text-xl">{t.product.writeReview}</h3>
            <p className="mb-4 text-sm text-navy-500">{t.product.reviewIntro}</p>
            {isDemoMode() ? <p className="text-sm text-navy-500">{t.product.reviewErrors.not_configured}</p> : <ReviewForm productId={p.id} />}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="related-h">
          <h2 id="related-h" className="section-title mb-6">{t.product.relatedTitle}</h2>
          <ProductGrid products={related} lang={lang} />
        </section>
      )}
    </div>
  );
}
