import type { Lang } from './types';

export function formatNumber(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 15000 → "15,000 IQD" (English) / "15,000 د.ع" (Arabic). Digits stay Western so prices read the same everywhere. */
export function formatIQD(n: number, lang: Lang = 'en'): string {
  return lang === 'ar' ? `${formatNumber(n)} د.ع` : `${formatNumber(n)} IQD`;
}

export function formatDate(iso: string, lang: Lang = 'en'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-IQ-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Baghdad',
  }).format(d);
}

export function formatDateTime(iso: string, lang: Lang = 'en'): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-IQ-u-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Baghdad',
  }).format(d);
}
