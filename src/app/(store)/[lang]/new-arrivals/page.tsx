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
  return { title: t.shop.newTitle, description: t.shop.newSub, alternates: alternatesFor(lang, '/new-arrivals') };
}

export default async function NewArrivalsPage({ params, searchParams }: Props) {
  const lang = (await params).lang as Lang;
  const t = getDict(lang);
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  // "New" = the 24 most recently added products.
  const recent = [...products].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 24);
  return (
    <ShopView lang={lang} all={recent} categories={categories} query={parseShopQuery(await searchParams)} basePath="/new-arrivals" title={t.shop.newTitle} subtitle={t.shop.newSub} />
  );
}
