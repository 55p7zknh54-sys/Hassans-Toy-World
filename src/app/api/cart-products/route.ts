import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/data';

export const dynamic = 'force-dynamic';

/** Public product info for the items in a visitor's cart (names, current prices, stock). */
export async function GET(req: Request) {
  const ids = new Set(
    (new URL(req.url).searchParams.get('ids') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 60)
  );
  const all = await getProducts();
  const products = all
    .filter((p) => ids.has(p.id))
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name_en: p.name_en,
      name_ar: p.name_ar,
      price_iqd: p.price_iqd,
      sale_price_iqd: p.sale_price_iqd,
      sale_ends_at: p.sale_ends_at,
      stock: p.stock,
      image: p.images[0] ?? null,
    }));
  return NextResponse.json({ products }, { headers: { 'Cache-Control': 'no-store' } });
}
