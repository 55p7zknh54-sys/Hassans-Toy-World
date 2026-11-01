import Link from 'next/link';
import { Notice, PageHeader, td, th } from '@/components/admin/ui';
import { formatDate, formatIQD } from '@/lib/format';
import { sessionClient } from '@/lib/supabase/clients';

export const metadata = { title: 'Customers' };

type Row = {
  id: string; full_name: string; phone: string; is_flagged: boolean; is_blocked: boolean; created_at: string;
  orders: { id: string; status: string; total_iqd: number; delivery_attempts: { outcome: string }[] }[];
};

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = (sp.q ?? '').replace(/[%,()]/g, ' ').trim().slice(0, 40);
  const onlyFlagged = sp.flagged === '1';
  const sb = await sessionClient();
  let query = sb
    .from('customers')
    .select('id, full_name, phone, is_flagged, is_blocked, created_at, orders(id, status, total_iqd, delivery_attempts(outcome))')
    .order('created_at', { ascending: false })
    .limit(300);
  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);
  if (onlyFlagged) query = query.eq('is_flagged', true);
  const { data, error } = await query;
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <PageHeader title="Customers" sub="Everyone who has ordered. Customers with repeated failed deliveries are flagged automatically.">
        <Link href={onlyFlagged ? '/admin/customers' : '/admin/customers?flagged=1'} className="btn-ghost btn-sm">{onlyFlagged ? 'Show everyone' : '⚑ Only flagged'}</Link>
      </PageHeader>
      <Notice ok={sp.ok} error={sp.error ?? error?.message} />
      <form action="/admin/customers" className="mb-4">
        {onlyFlagged && <input type="hidden" name="flagged" value="1" />}
        <input name="q" defaultValue={q} placeholder="Search name or phone…" className="field !rounded-full md:w-80" aria-label="Search customers" />
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-cream-dark"><tr><th className={th}>Customer</th><th className={th}>Orders</th><th className={th}>Delivered</th><th className={th}>Failed deliveries</th><th className={th}>Spent</th><th className={th}>Since</th></tr></thead>
          <tbody className="divide-y divide-navy/10">
            {rows.map((c) => {
              const delivered = c.orders.filter((o) => o.status === 'delivered');
              const failed = c.orders.reduce((n, o) => n + o.delivery_attempts.filter((a) => a.outcome === 'failed').length, 0);
              return (
                <tr key={c.id} className={c.is_flagged || c.is_blocked ? 'bg-pink-50' : ''}>
                  <td className={td}>
                    <Link href={`/admin/customers/${c.id}`} className="font-display font-bold text-pink-700 underline">{c.full_name}</Link>
                    <div className="ltr-iso text-sm text-navy-500">{c.phone}</div>
                    {c.is_blocked && <span className="chip bg-navy text-white">Blocked</span>} {c.is_flagged && <span className="chip bg-pink-100 text-pink-700">⚑ Flagged</span>}
                  </td>
                  <td className={td}>{c.orders.length}</td>
                  <td className={td}>{delivered.length}</td>
                  <td className={`${td} ${failed ? 'font-bold text-pink-700' : ''}`}>{failed}</td>
                  <td className={`${td} ltr-iso`}>{formatIQD(delivered.reduce((n, o) => n + o.total_iqd, 0), 'en')}</td>
                  <td className={`${td} text-sm text-navy-500`}>{formatDate(c.created_at, 'en')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-8 text-center text-navy-500">No customers yet — they appear when the first order is placed.</p>}
      </div>
    </>
  );
}
