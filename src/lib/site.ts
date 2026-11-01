import type { Lang } from './types';

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return raw.replace(/\/+$/, '');
}

/** Absolute URL for a site path or an already-absolute image URL. */
export function absoluteUrl(pathOrUrl: string): string {
  return /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : `${siteUrl()}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

/** hreflang alternates for a path that exists in both languages, e.g. '/shop'. */
export function alternatesFor(lang: Lang, path = '') {
  return {
    canonical: `/${lang}${path}`,
    languages: { en: `/en${path}`, ar: `/ar${path}`, 'x-default': `/en${path}` },
  };
}
