import type { MetadataRoute } from 'next';
import { INFO_PAGES } from '@/content/pages';
import { getCategories, getProducts } from '@/lib/data';
import { siteUrl } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const base = siteUrl();
  const paths: { path: string; priority: number; lastModified?: string }[] = [
    { path: '', priority: 1 },
    { path: '/shop', priority: 0.9 },
    { path: '/new-arrivals', priority: 0.8 },
    { path: '/best-sellers', priority: 0.8 },
    { path: '/sale', priority: 0.6 },
    ...Object.keys(INFO_PAGES).map((p) => ({ path: `/${p}`, priority: 0.4 })),
    ...categories.map((c) => ({ path: `/category/${c.slug}`, priority: 0.8 })),
    ...products.map((p) => ({ path: `/product/${p.slug}`, priority: 0.7, lastModified: p.created_at })),
  ];
  return paths.flatMap(({ path, priority, lastModified }) =>
    (['en', 'ar'] as const).map((lang) => ({
      url: `${base}/${lang}${path}`,
      lastModified,
      priority,
      alternates: { languages: { en: `${base}/en${path}`, ar: `${base}/ar${path}` } },
    }))
  );
}
