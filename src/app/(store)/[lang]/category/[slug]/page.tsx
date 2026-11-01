import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ShopView, parseShopQuery, type RawSearchParams } from '@/components/shop/ShopView';
import { getCategories, getProducts } from '@/lib/data';
import { alternatesFor } from '@/lib/site';
import { pick, type Lang } from '@/lib/types';

type Props = { params: Promise<{ lang: string; slug: string }>; searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const cat = (await getCategories()).find((c) => c.slug === slug);
  if (!cat) return {};
  return {
    title: pick(cat, 'name', lang as Lang),
    description: pick(cat, 'description', lang as Lang) || undefined,
    alternates: alternatesFor(lang as Lang, `/category/${slug}`),
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { lang, slug } = await params;
  const [all, categories] = await Promise.all([getProducts(), getCategories()]);
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) notFound();
  return (
    <ShopView
      lang={lang as Lang}
      all={all}
      categories={categories}
      query={{ ...parseShopQuery(await searchParams), category: slug }}
      basePath={`/category/${slug}`}
      title={pick(cat, 'name', lang as Lang)}
      subtitle={pick(cat, 'description', lang as Lang)}
      showCategories={false}
    />
  );
}
