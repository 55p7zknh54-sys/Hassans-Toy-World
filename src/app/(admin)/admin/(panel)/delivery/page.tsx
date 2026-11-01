import Link from 'next/link';
import { Card, Check, Field, Notice, PageHeader, StatusBadge, td, th } from '@/components/admin/ui';
import { addDeliveryFee, saveCourier, saveDeliveryFee } from '@/lib/actions/admin';
import { formatDate, formatIQD } from '@/lib/format';
import { sessionClient } from '@/lib/supabase/clients';
import type { OrderStatus } from '@/lib/types';

export const metadata = { title: 'Delivery' };

export default async function DeliveryPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const sb = await sessionClient();
  const [fees, couriers, active] = await Promise.all([
    sb.from('delivery_fees').select('*').order('sort_order').order('name_en'),
    sb.from('couriers').select('*').order('created_at'),
    sb.from('orders')
      .select('id, order_number, status, customer_name, governorate_name_en, shipped_at, created_at, couriers(name)')
      .in('status', ['confirmed', 'processing', 'shipped'])
      .order('created_at'),
  ]);

  return (
    <>
      <PageHeader title="Delivery" sub="Delivery fees by governorate (the customer pays this on top of the products), couriers and shipments." />
      <Notice ok={sp.ok} error={sp.error ?? fees.error?.message} />

      <Card title="Delivery fees by governorate">
        <p className="mb-4 text-sm text-navy-500">The customer sees the fee before confirming. Untick “Delivers here” to stop orders from a governorate. The sample fees are placeholders — enter your real courier prices.</p>
        <ul className="divide-y divide-navy/10">
          {(fees.data ?? []).map((f) => (
            <li key={f.code}>
              <form action={saveDeliveryFee} className="flex flex-wrap items-center gap-3 py-2">
                <input type="hidden" name="code" value={f.code} />
                <span className="min-w-36 flex-1 font-semibold">{f.name_en} <span className="text-navy-500" dir="rtl">· {f.name_ar}</span></span>
                <label className="flex items-center gap-2 text-sm font-semibold">Fee (IQD)
                  <input name="fee_iqd" type="number" min={0} step={250} defaultValue={f.fee_iqd} className="field !min-h-11 w-32" />
                </label>
                <label className="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" name="is_active" defaultChecked={f.is_active} className="h-5 w-5 accent-pink-600" /> Delivers here</label>
                <button type="submit" className="btn-navy btn-sm">Save</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addDeliveryFee} className="mt-5 grid gap-3 rounded-2xl bg-cream-dark p-4 sm:grid-cols-4 sm:items-end">
          <Field label="Add governorate (English)" name="name_en" required />
          <Field label="Arabic name" name="name_ar" dir="rtl" required />
          <Field label="Fee (IQD)" name="fee_iqd" type="number" min={0} required />
          <button type="submit" className="btn-primary">Add</button>
        </form>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Couriers">
          <ul className="space-y-3">
            {(couriers.data ?? []).map((c) => (
              <li key={c.id}>
                <form action={saveCourier} className="grid gap-2 rounded-2xl bg-cream-dark p-3 sm:grid-cols-2">
                  <input type="hidden" name="id" value={c.id} />
                  <input name="name" defaultValue={c.name} required aria-label="Courier name" className="field !min-h-11" />
                  <input name="phone" defaultValue={c.phone ?? ''} placeholder="Phone" aria-label="Courier phone" className="field !min-h-11" />
                  <input name="notes" defaultValue={c.notes ?? ''} placeholder="Notes (areas, prices…)" aria-label="Courier notes" className="field !min-h-11 sm:col-span-2" />
                  <div className="flex items-center justify-between sm:col-span-2">
                    <Check name="is_active" label="Active" defaultChecked={c.is_active} />
                    <button type="submit" className="btn-navy btn-sm">Save</button>
                  </div>
                </form>
              </li>
            ))}
            {(couriers.data ?? []).length === 0 && <li className="text-navy-500">No couriers yet. Add the delivery companies or drivers you work with.</li>}
          </ul>
          <form action={saveCourier} className="mt-4 grid gap-3 border-t border-navy/10 pt-4 sm:grid-cols-2">
            <Field label="New courier name" name="name" required />
            <Field label="Phone (optional)" name="phone" />
            <div className="sm:col-span-2"><button type="submit" className="btn-primary btn-sm">Add courier</button></div>
          </form>
        </Card>

        <Card title="Shipments in progress">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px]">
              <thead><tr><th className={th}>Order</th><th className={th}>Where</th><th className={th}>Courier</th><th className={th}>Status</th></tr></thead>
              <tbody className="divide-y divide-navy/10">
                {(active.data ?? []).map((o) => (
                  <tr key={o.id}>
                    <td className={td}><Link href={`/admin/orders/${o.id}`} className="font-bold text-pink-700 underline">{o.order_number}</Link><div className="text-xs text-navy-500">{o.shipped_at ? `shipped ${formatDate(o.shipped_at, 'en')}` : formatDate(o.created_at, 'en')}</div></td>
                    <td className={td}>{o.governorate_name_en}</td>
                    <td className={td}>{(o.couriers as unknown as { name: string } | null)?.name ?? '—'}</td>
                    <td className={td}><StatusBadge status={o.status as OrderStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(active.data ?? []).length === 0 && <p className="py-6 text-center text-navy-500">Nothing in progress.</p>}
          </div>
          <p className="mt-3 text-xs text-navy-500">Fee reference: Baghdad is {formatIQD((fees.data ?? []).find((f) => f.code === 'baghdad')?.fee_iqd ?? 0, 'en')}. Record failed deliveries from the order page.</p>
        </Card>
      </div>
    </>
  );
}
