import Image from 'next/image';
import Link from 'next/link';
import { Notice, PageHeader } from '@/components/admin/ui';
import { quickEditProduct } from '@/lib/actions/admin';
import { sessionClient } from '@/lib/supabase/clients';

export const metadata = { title: 'Products' };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const sb = await sessionClient();
  const { data: products, error } = await sb
    .from('products')
    .select('id, slug, name_en, price_iqd, sale_price_iqd, stock, images, is_active, featured, best_seller, categories(name_en)')
    .order('created_at', { ascending: false });

  return (
    <>
      <PageHeader title="Products" sub="Change a price or stock right here, or open a product for photos and descriptions.">
        <Link href="/admin/products/new" className="btn-primary">+ Add product</Link>
      </PageHeader>
      <Notice ok={sp.ok} error={sp.error ?? error?.message} />
      <ul className="space-y-3">
        {(products ?? []).map((p) => {
          const cat = p.categories as unknown as { name_en: string } | null;
          return (
            <li key={p.id} className={`card flex flex-col gap-3 p-4 lg:flex-row lg:items-center ${p.is_active ? '' : 'opacity-60'}`}>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream-dark">{p.images?.[0] && <Image src={p.images[0]} alt="" fill sizes="64px" className="object-cover" />}</span>
                <div className="min-w-0">
                  <Link href={`/admin/products/${p.id}`} className="font-display font-bold text-pink-700 underline">{p.name_en}</Link>
                  <p className="text-sm text-navy-500">{cat?.name_en}{!p.is_active && ' · hidden'}{p.featured && ' · trending'}{p.best_seller && ' · best seller'}{p.stock <= 0 && ' · SOLD OUT'}</p>
                </div>
              </div>
              <form action={quickEditProduct} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={p.id} />
                <label className="text-xs font-bold text-navy-500">Price (IQD)<input name="price_iqd" type="number" min={0} defaultValue={p.price_iqd} className="field !min-h-11 w-28" /></label>
                <label className="text-xs font-bold text-navy-500">Sale price<input name="sale_price_iqd" type="number" min={0} defaultValue={p.sale_price_iqd ?? ''} placeholder="none" className="field !min-h-11 w-28" /></label>
                <label className="text-xs font-bold text-navy-500">Stock<input name="stock" type="number" min={0} defaultValue={p.stock} className="field !min-h-11 w-20" /></label>
                <button type="submit" className="btn-navy btn-sm">Save</button>
              </form>
            </li>
          );
        })}
      </ul>
      {(products ?? []).length === 0 && <p className="card p-8 text-center text-navy-500">No products yet. Run supabase/seed.sql for sample products, or add your own.</p>}
    </>
  );
}
