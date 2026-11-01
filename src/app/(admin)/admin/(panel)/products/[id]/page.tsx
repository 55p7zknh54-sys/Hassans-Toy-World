import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, Check, Field, Notice, PageHeader } from '@/components/admin/ui';
import { deleteProduct, saveProduct } from '@/lib/actions/admin';
import { sessionClient } from '@/lib/supabase/clients';

export const metadata = { title: 'Product' };

export default async function ProductForm({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === 'new';
  const sb = await sessionClient();
  const [{ data: categories }, prod, cost] = await Promise.all([
    sb.from('categories').select('id, name_en').order('sort_order'),
    isNew ? Promise.resolve({ data: null }) : sb.from('products').select('*').eq('id', id).maybeSingle(),
    isNew ? Promise.resolve({ data: null }) : sb.from('product_costs').select('cost_iqd').eq('product_id', id).maybeSingle(),
  ]);
  const p = prod.data;
  if (!isNew && !p) notFound();
  const saleEnd = p?.sale_ends_at ? new Date(p.sale_ends_at).toISOString().slice(0, 10) : '';

  return (
    <>
      <PageHeader title={isNew ? 'Add product' : p!.name_en}>
        <Link href="/admin/products" className="btn-ghost btn-sm">← All products</Link>
        {!isNew && <Link href={`/en/product/${p!.slug}`} target="_blank" className="btn-ghost btn-sm">View in store ↗</Link>}
      </PageHeader>
      <Notice ok={sp.ok} error={sp.error} />

      <form action={saveProduct} className="grid gap-6 xl:grid-cols-3">
        {!isNew && <input type="hidden" name="id" value={p!.id} />}
        <div className="space-y-6 xl:col-span-2">
          <Card title="Name and description">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name (English)" name="name_en" required defaultValue={p?.name_en} />
              <Field label="Name (Arabic)" name="name_ar" required dir="rtl" defaultValue={p?.name_ar} />
              <div>
                <label htmlFor="description_en" className="field-label">Description (English)</label>
                <textarea id="description_en" name="description_en" rows={5} defaultValue={p?.description_en} className="field" />
              </div>
              <div>
                <label htmlFor="description_ar" className="field-label">Description (Arabic)</label>
                <textarea id="description_ar" name="description_ar" rows={5} dir="rtl" defaultValue={p?.description_ar} className="field" />
              </div>
              <Field label="Promo badge (English, optional)" name="promo_label_en" defaultValue={p?.promo_label_en ?? ''} placeholder="e.g. Buy 2 get a free sticker" />
              <Field label="Promo badge (Arabic, optional)" name="promo_label_ar" dir="rtl" defaultValue={p?.promo_label_ar ?? ''} />
            </div>
          </Card>

          <Card title="Photos">
            {(p?.images ?? []).length > 0 && (
              <ul className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {(p!.images as string[]).map((src) => (
                  <li key={src} className="space-y-1 text-center text-xs">
                    <span className="relative block aspect-square overflow-hidden rounded-xl bg-cream-dark"><Image src={src} alt="" fill sizes="120px" className="object-cover" /></span>
                    <label className="flex items-center justify-center gap-1.5 font-semibold"><input type="checkbox" name="keep_image" value={src} defaultChecked className="h-5 w-5 accent-pink-600" /> Keep</label>
                  </li>
                ))}
              </ul>
            )}
            <label htmlFor="new_images" className="field-label">Upload new photos (JPG/PNG/WebP, up to 8)</label>
            <input id="new_images" name="new_images" type="file" accept="image/*" multiple className="field !py-3" />
            <p className="mt-1 text-xs text-navy-500">Photos are resized and compressed automatically. The first photo is the main one. Untick “Keep” to remove a photo.</p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Price and stock">
            <div className="space-y-4">
              <Field label="Price (IQD)" name="price_iqd" type="number" min={0} required defaultValue={p?.price_iqd ?? ''} />
              <Field label="Sale price (IQD, optional)" name="sale_price_iqd" type="number" min={0} defaultValue={p?.sale_price_iqd ?? ''} hint="Must be lower than the price. Leave empty for no discount." />
              <Field label="Sale ends on (optional)" name="sale_ends_at" type="date" defaultValue={saleEnd} hint="After this day the normal price comes back automatically." />
              <Field label="Your cost per item (IQD)" name="cost_iqd" type="number" min={0} required defaultValue={cost.data?.cost_iqd ?? 0} hint="Private. Used only to estimate your profit." />
              <Field label="Stock (how many you have)" name="stock" type="number" min={0} required defaultValue={p?.stock ?? 0} />
            </div>
          </Card>
          <Card title="Category and visibility">
            <div className="space-y-3">
              <div>
                <label htmlFor="category_id" className="field-label">Category</label>
                <select id="category_id" name="category_id" required defaultValue={p?.category_id ?? ''} className="field">
                  <option value="" disabled>Choose…</option>
                  {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                </select>
              </div>
              <Check name="is_active" label="Show in the store" defaultChecked={p ? p.is_active : true} />
              <Check name="featured" label="Featured (“Trending Now”)" defaultChecked={p?.featured} />
              <Check name="best_seller" label="Best seller" defaultChecked={p?.best_seller} />
            </div>
          </Card>
          <button type="submit" className="btn-primary min-h-14 w-full text-lg">{isNew ? 'Create product' : 'Save changes'}</button>
        </div>
      </form>

      {!isNew && (
        <form action={deleteProduct} className="mt-8">
          <input type="hidden" name="id" value={p!.id} />
          <details className="card p-4">
            <summary className="cursor-pointer font-semibold text-pink-700">Delete this product…</summary>
            <p className="my-3 text-sm text-navy-500">This removes it from the store for good. Past orders keep their details. To just hide it, untick “Show in the store” above instead.</p>
            <button type="submit" className="btn bg-pink-700 text-white">Yes, delete permanently</button>
          </details>
        </form>
      )}
    </>
  );
}
