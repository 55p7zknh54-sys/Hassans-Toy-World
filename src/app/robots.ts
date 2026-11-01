import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/en/cart', '/ar/cart', '/en/checkout', '/ar/checkout', '/en/track', '/ar/track'] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
