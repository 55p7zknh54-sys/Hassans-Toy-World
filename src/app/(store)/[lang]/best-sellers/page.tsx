import type { Metadata } from 'next';
import { ShopView, parseShopQuery, type RawSearchParams } from '@/components/shop/ShopView';
import { getDict } from '@/i18n';
import { getCategories, getProducts } from '@/lib/data';
import { alternatesFor } from '@/lib/site';
import type { Lang } from '@/lib/types';

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = (await params).lang as Lang;
  const t = getDict(lang);
  return { title: t.shop.bestTitle, description: t.home.bestSub, alternates: alternatesFor(lang, '/best-sellers') };
}

export default async function BestSellersPage({ params, searchParams }: Props) {
  const lang = (await params).lang as Lang;
  const t = getDict(lang);
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return (
    <ShopView lang={lang} all={products.filter((p) => p.best_seller)} categories={categories} query={parseShopQuery(await searchParams)} basePath="/best-sellers" title={t.shop.bestTitle} subtitle={t.home.bestSub} />
  );
}
