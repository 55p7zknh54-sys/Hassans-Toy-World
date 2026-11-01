'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Dict } from '@/i18n/en';
import type { Lang } from '@/lib/types';
import { localePath } from '@/i18n';

type Ctx = { lang: Lang; t: Dict };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ lang, dict, children }: { lang: Lang; dict: Dict; children: ReactNode }) {
  return <I18nContext.Provider value={{ lang, t: dict }}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx & { href: (path?: string) => string } {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return { ...ctx, href: (path = '/') => localePath(ctx.lang, path) };
}
