import 'server-only';
import { unstable_cache } from 'next/cache';
import catalogJson from '../../data/catalog.json';
import { isDemoMode, publicClient } from './supabase/clients';
import type { Category, DeliveryFee, Product, Review, StoreSettings } from './types';

/**
 * Read-only data access for the storefront. Everything is cached for 60 s and refreshed
 * immediately when an admin saves a change (revalidateTag('catalog')).
 * If Supabase is not configured the sample catalogue in data/catalog.json is used (preview mode).
 */

type DemoProduct = {
  slug: string; category: string; name_en: string; name_ar: string; description_en: string; description_ar: string;
  price: number; sale_price: number | null; stock: number; featured: boolean; best_seller: boolean; days_ago: number;
};

const DEMO_SETTINGS: StoreSettings = {
  whatsapp_number: null,
  contact_phone: null,
  contact_email: null,
  address_en: null,
  address_ar: null,
  instagram_url: null,
  tiktok_url: null,
  facebook_url: null,
  orders_enabled: false,
  promo_active: true,
  promo_title_en: 'Little Toys. BIG Happiness!',
  promo_title_ar: 'ألعاب صغيرة. سعادة كبيرة!',
  promo_text_en: 'Fresh squishies, plushies and collectibles are waiting for you.',
  promo_text_ar: 'سكويشي ودمى ومقتنيات جديدة بانتظارك.',
};

function demoCategories(): Category[] {
  return catalogJson.categories.map((c) => ({
    id: c.slug,
    slug: c.slug,
    name_en: c.name_en,
    name_ar: c.name_ar,
    description_en: c.description_en,
    description_ar: c.description_ar,
    image_url: c.image,
    color: c.color as Category['color'],
    sort_order: c.sort_order,
    is_active: true,
  }));
}

function demoProducts(): Product[] {
  const day = 86_400_000;
  return (catalogJson.products as DemoProduct[]).map((p) => ({
    id: p.slug,
    slug: p.slug,
    category_id: p.category,
    category_slug: p.category,
    name_en: p.name_en,
    name_ar: p.name_ar,
    description_en: p.description_en,
    description_ar: p.description_ar,
    price_iqd: p.price,
    sale_price_iqd: p.sale_price,
    sale_ends_at: null,
    stock: p.stock,
    images: [1, 2, 3].map((i) => `/products/${p.slug}-${i}.svg`),
    featured: p.featured,
    best_seller: p.best_seller,
    is_active: true,
    promo_label_en: null,
    promo_label_ar: null,
    created_at: new Date(Date.now() - p.days_ago * day).toISOString(),
    rating_avg: null,
    rating_count: 0,
  }));
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const getProducts = unstable_cache(
  async (): Promise<Product[]> => {
    if (isDemoMode()) return demoProducts();
    const sb = publicClient();
    const [prod, rate] = await Promise.all([
      sb
        .from('products')
        .select('*, categories!inner(slug)')
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      sb.from('product_ratings').select('product_id, avg_rating, review_count'),
    ]);
    if (prod.error) throw new Error(`products: ${prod.error.message}`);
    const ratings = new Map<string, { avg: number; n: number }>(
      (rate.data ?? []).map((r: any) => [r.product_id, { avg: r.avg_rating, n: r.review_count }])
    );
    return (prod.data ?? []).map((r: any): Product => {
      const rt = ratings.get(r.id);
      const { categories, ...rest } = r;
      return {
        ...rest,
        category_slug: categories?.slug ?? '',
        images: Array.isArray(r.images) ? r.images : [],
        rating_avg: rt?.avg ?? null,
        rating_count: rt?.n ?? 0,
      } as Product;
    });
  },
  ['products-v1'],
  { revalidate: 60, tags: ['catalog'] }
);

export const getCategories = unstable_cache(
  async (): Promise<Category[]> => {
    if (isDemoMode()) return demoCategories();
    const { data, error } = await publicClient()
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw new Error(`categories: ${error.message}`);
    return (data ?? []) as Category[];
  },
  ['categories-v1'],
  { revalidate: 60, tags: ['catalog'] }
);

export const getDeliveryFees = unstable_cache(
  async (): Promise<DeliveryFee[]> => {
    if (isDemoMode()) {
      return catalogJson.delivery_fees.map((d) => ({
        code: d.code,
        name_en: d.name_en,
        name_ar: d.name_ar,
        fee_iqd: d.fee,
        is_active: true,
        sort_order: d.sort_order,
      }));
    }
    const { data, error } = await publicClient()
      .from('delivery_fees')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw new Error(`delivery_fees: ${error.message}`);
    return (data ?? []) as DeliveryFee[];
  },
  ['delivery-fees-v1'],
  { revalidate: 60, tags: ['catalog'] }
);

export const getSettings = unstable_cache(
  async (): Promise<StoreSettings> => {
    if (isDemoMode()) return DEMO_SETTINGS;
    const { data, error } = await publicClient().from('store_settings').select('*').eq('id', 1).maybeSingle();
    if (error) throw new Error(`store_settings: ${error.message}`);
    return { ...DEMO_SETTINGS, ...(data ?? {}) } as StoreSettings;
  },
  ['settings-v1'],
  { revalidate: 60, tags: ['catalog'] }
);

const REVIEW_COLS =
  'id, product_id, reviewer_name, rating, body, verified_purchase, created_at, products(name_en, name_ar, slug)';

function mapReview(r: any): Review {
  const { products, ...rest } = r;
  return {
    ...rest,
    product_name_en: products?.name_en,
    product_name_ar: products?.name_ar,
    product_slug: products?.slug,
  } as Review;
}

/** Latest approved reviews for the homepage. Empty until real customers write (and you approve) some. */
export const getRecentReviews = unstable_cache(
  async (limit: number): Promise<Review[]> => {
    if (isDemoMode()) return [];
    const { data, error } = await publicClient()
      .from('reviews')
      .select(REVIEW_COLS)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(`reviews: ${error.message}`);
    return (data ?? []).map(mapReview);
  },
  ['reviews-recent-v1'],
  { revalidate: 60, tags: ['reviews'] }
);

export const getProductReviews = unstable_cache(
  async (productId: string): Promise<Review[]> => {
    if (isDemoMode()) return [];
    const { data, error } = await publicClient()
      .from('reviews')
      .select(REVIEW_COLS)
      .eq('product_id', productId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw new Error(`reviews: ${error.message}`);
    return (data ?? []).map(mapReview);
  },
  ['reviews-product-v1'],
  { revalidate: 60, tags: ['reviews'] }
);

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const all = await getProducts();
  return all.find((p) => p.slug === slug);
}
