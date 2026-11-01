import { Card, Check, Field, Notice, PageHeader } from '@/components/admin/ui';
import { deleteCategory, saveCategory } from '@/lib/actions/admin';
import { sessionClient } from '@/lib/supabase/clients';

export const metadata = { title: 'Categories' };

const COLORS = ['pink', 'yellow', 'blue', 'purple'];

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const sb = await sessionClient();
  const { data: cats, error } = await sb.from('categories').select('*, products(count)').order('sort_order');

  return (
    <>
      <PageHeader title="Categories" sub="Groups of products shown on the homepage and in the shop menu." />
      <Notice ok={sp.ok} error={sp.error ?? error?.message} />

      <div className="space-y-4">
        {(cats ?? []).map((c) => {
          const count = (c.products as unknown as { count: number }[])?.[0]?.count ?? 0;
          return (
            <Card key={c.id}>
              <form action={saveCategory} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <input type="hidden" name="id" value={c.id} />
                <label className="field-label">Name (English)<input name="name_en" defaultValue={c.name_en} required className="field mt-1 font-normal" /></label>
                <label className="field-label">Name (Arabic)<input name="name_ar" dir="rtl" defaultValue={c.name_ar} required className="field mt-1 font-normal" /></label>
                <label className="field-label">Colour
                  <select name="color" defaultValue={c.color} className="field mt-1 font-normal capitalize">{COLORS.map((x) => <option key={x} value={x}>{x}</option>)}</select>
                </label>
                <label className="field-label">Order<input name="sort_order" type="number" min={0} defaultValue={c.sort_order} className="field mt-1 font-normal" /></label>
                <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap items-center gap-4">
                  <Check name="is_active" label="Show in the store" defaultChecked={c.is_active} />
                  <span className="text-sm text-navy-500">{count} product{count === 1 ? '' : 's'}</span>
                  <button type="submit" className="btn-navy btn-sm ms-auto">Save</button>
                </div>
              </form>
              {count === 0 && (
                <form action={deleteCategory} className="mt-2">
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" className="text-sm font-semibold text-pink-700 underline">Delete this empty category</button>
                </form>
              )}
            </Card>
          );
        })}
      </div>

      <Card title="Add a category" className="mt-6">
        <form action={saveCategory} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Name (English)" name="name_en" required />
          <Field label="Name (Arabic)" name="name_ar" dir="rtl" required />
          <div>
            <label htmlFor="color_new" className="field-label">Colour</label>
            <select id="color_new" name="color" defaultValue="pink" className="field capitalize">{COLORS.map((x) => <option key={x} value={x}>{x}</option>)}</select>
          </div>
          <Field label="Order" name="sort_order" type="number" min={0} defaultValue={50} />
          <div className="sm:col-span-2 lg:col-span-4"><button type="submit" className="btn-primary">Add category</button></div>
        </form>
      </Card>
    </>
  );
}
