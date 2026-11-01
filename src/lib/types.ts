export type Lang = 'en' | 'ar';
export const LANGS: readonly Lang[] = ['en', 'ar'] as const;
export const DEFAULT_LANG: Lang = 'en';

export function isLang(v: unknown): v is Lang {
  return v === 'en' || v === 'ar';
}

export type Product = {
  id: string;
  slug: string;
  category_id: string;
  category_slug: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  price_iqd: number;
  sale_price_iqd: number | null;
  sale_ends_at: string | null;
  stock: number;
  images: string[];
  featured: boolean;
  best_seller: boolean;
  is_active: boolean;
  promo_label_en: string | null;
  promo_label_ar: string | null;
  created_at: string;
  rating_avg: number | null;
  rating_count: number;
};

export type Category = {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  image_url: string | null;
  color: 'pink' | 'yellow' | 'blue' | 'purple';
  sort_order: number;
  is_active: boolean;
};

export type DeliveryFee = {
  code: string;
  name_en: string;
  name_ar: string;
  fee_iqd: number;
  is_active: boolean;
  sort_order: number;
};

export type StoreSettings = {
  whatsapp_number: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address_en: string | null;
  address_ar: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  orders_enabled: boolean;
  promo_active: boolean;
  promo_title_en: string;
  promo_title_ar: string;
  promo_text_en: string;
  promo_text_ar: string;
};

export type Review = {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  body: string;
  verified_purchase: boolean;
  created_at: string;
  product_name_en?: string;
  product_name_ar?: string;
  product_slug?: string;
};

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
] as const;

/** Mirrors the database trigger: which status may follow which. */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

/** Pick the English or Arabic version of a bilingual field (falls back to English). */
export function pick<T extends Record<string, unknown>>(obj: T, field: string, lang: Lang): string {
  const v = obj[`${field}_${lang}`];
  if (typeof v === 'string' && v.trim()) return v;
  const en = obj[`${field}_en`];
  return typeof en === 'string' ? en : '';
}
