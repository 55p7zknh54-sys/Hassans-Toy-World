import Link from 'next/link';
import { Flags, Notice, PageHeader, StatusBadge, td, th } from '@/components/admin/ui';
import { formatDateTime, formatIQD } from '@/lib/format';
import { sessionClient } from '@/lib/supabase/clients';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/types';

export const metadata = { title: 'Orders' };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const status = ORDER_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const q = (sp.q ?? '').replace(/[%,()]/g, ' ').trim().slice(0, 40);
  const sb = await sessionClient();
  let query = sb
    .from('orders')
    .select('id, order_number, customer_name, phone, governorate_name_en, total_iqd, status, flags, needs_review, deposit_required, created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  if (status) query = query.eq('status', status);
  if (q) query = query.or(`order_number.ilike.%${q}%,phone.ilike.%${q}%,customer_name.ilike.%${q}%`);
  const { data: orders, error } = await query;

  const tab = (label: string, value?: string) => (
    <Link
      key={label}
      href={value ? `/admin/orders?status=${value}` : '/admin/orders'}
      className={`min-h-11 whitespace-nowrap rounded-full px-4 py-2.5 font-display text-sm font-semibold capitalize ${status === value ? 'bg-pink-600 text-white' : 'bg-white text-navy shadow-soft'}`}
    >
      {label}
    </Link>
  );

  return (
    <>
      <PageHeader title="Orders" sub="Call the customer, then approve (confirm) the order before it can be prepared or sent." />
      <Notice ok={sp.ok} error={sp.error ?? error?.message} />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex gap-2 overflow-x-auto pb-1">{[tab('All'), ...ORDER_STATUSES.map((s) => tab(s, s))]}</div>
        <form className="md:ms-auto" action="/admin/orders">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Search order no., phone, name…" className="field !rounded-full md:w-72" aria-label="Search orders" />
        </form>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead className="bg-cream-dark"><tr><th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Governorate</th><th className={th}>Total</th><th className={th}>Status</th><th className={th}>Placed</th></tr></thead>
          <tbody className="divide-y divide-navy/10">
            {(orders ?? []).map((o) => (
              <tr key={o.id} className={o.needs_review && o.status === 'pending' ? 'bg-pink-50' : ''}>
                <td className={td}>
                  <Link href={`/admin/orders/${o.id}`} className="font-display font-bold text-pink-700 underline">{o.order_number}</Link>
                  <div className="mt-1"><Flags flags={o.flags} /></div>
                </td>
                <td className={td}>{o.customer_name}<div className="ltr-iso text-sm text-navy-500">{o.phone}</div></td>
                <td className={td}>{o.governorate_name_en}</td>
                <td className={`${td} ltr-iso font-semibold`}>{formatIQD(o.total_iqd, 'en')}{o.deposit_required && <div className="text-xs font-normal text-pink-700">deposit asked</div>}</td>
                <td className={td}><StatusBadge status={o.status} /></td>
                <td className={`${td} text-sm text-navy-500`}>{formatDateTime(o.created_at, 'en')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(orders ?? []).length === 0 && <p className="p-8 text-center text-navy-500">No orders here yet.</p>}
      </div>
    </>
  );
}
