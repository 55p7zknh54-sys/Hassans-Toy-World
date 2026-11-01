import type { Metadata } from 'next';
import { ShopView, parseShopQuery, type RawSearchParams } from '@/components/shop/ShopView';
import { getDict } from '@/i18n';
import { getCategories, getProducts } from '@/lib/data';
import { isOnSale } from '@/lib/pricing';
import { alternatesFor } from '@/lib/site';
import type { Lang } from '@/lib/types';

type Props = { params: Promise<{ lang: string }>; searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lang = (await params).lang as Lang;
  const t = getDict(lang);
  return { title: t.shop.saleTitle, description: t.shop.saleSub, alternates: alternatesFor(lang, '/sale') };
}

export default async function SalePage({ params, searchParams }: Props) {
  const lang = (await params).lang as Lang;
  const t = getDict(lang);
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return (
    <ShopView lang={lang} all={products.filter((p) => isOnSale(p))} categories={categories} query={parseShopQuery(await searchParams)} basePath="/sale" title={t.shop.saleTitle} subtitle={t.shop.saleSub} />
  );
}
