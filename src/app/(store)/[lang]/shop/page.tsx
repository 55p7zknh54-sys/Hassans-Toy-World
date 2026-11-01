import type { Metadata } from 'next';
import { ShopView, parseShopQuery, type RawSearchParams } from '@/components/shop/ShopView';
import { getDict } from '@/i18n';
import { getCategories, getProducts } from '@/lib/data';
import { alternatesFor } from '@/lib/site';
import type { Lang } from '@/lib/types';

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const lang = (await params).lang as Lang;
  const t = getDict(lang);
  const q = parseShopQuery(await searchParams);
  const filtered = !!(q.q || q.category || q.sale || q.best || q.inStock || (q.sort && q.sort !== 'newest'));
  return {
    title: t.shop.title,
    description: t.brand.tagline,
    alternates: alternatesFor(lang, '/shop'),
    robots: filtered ? { index: false, follow: true } : undefined, // search/filter result pages stay out of Google
  };
}

export default async function ShopPage({ params, searchParams }: Props) {
  const lang = (await params).lang as Lang;
  const t = getDict(lang);
  const [all, categories] = await Promise.all([getProducts(), getCategories()]);
  return (
    <ShopView lang={lang} all={all} categories={categories} query={parseShopQuery(await searchParams)} basePath="/shop" title={t.shop.title} />
  );
}
