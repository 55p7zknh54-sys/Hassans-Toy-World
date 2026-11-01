import { en, type Dict } from './en';
import { ar } from './ar';
import type { Lang } from '@/lib/types';

const dicts: Record<Lang, Dict> = { en, ar };

export function getDict(lang: Lang): Dict {
  return dicts[lang];
}

/** Replaces {placeholders}: fmt('Only {n} left', { n: 3 }) → 'Only 3 left'. */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export const dirOf = (lang: Lang): 'ltr' | 'rtl' => (lang === 'ar' ? 'rtl' : 'ltr');

/** localePath('ar', '/shop') → '/ar/shop';  localePath('en', '/') → '/en' */
export function localePath(lang: Lang, path: string = '/'): string {
  const p = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `/${lang}${p}`;
}

/** Swaps the language prefix of a path: '/en/shop?x=1' → '/ar/shop?x=1' */
export function switchLangPath(pathname: string, to: Lang): string {
  const rest = pathname.replace(/^\/(en|ar)(?=\/|$)/, '');
  return `/${to}${rest}`;
}
