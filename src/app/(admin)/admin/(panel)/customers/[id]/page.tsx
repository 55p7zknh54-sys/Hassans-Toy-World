import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, Check, Field, Notice, PageHeader, StatusBadge, td, th } from '@/components/admin/ui';
import { saveCustomer } from '@/lib/actions/admin';
import { formatDate, formatDateTime, formatIQD } from '@/lib/format';
import { sessionClient } from '@/lib/supabase/clients';
import type { OrderStatus } from '@/lib/types';

export const metadata = { title: 'Customer' };

export default async function CustomerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const sb = await sessionClient();
  const { data: c } = await sb.from('customers').select('*').eq('id', id).maybeSingle();
  if (!c) notFound();
  const { data: orders } = await sb
    .from('orders')
    .select('id, order_number, status, total_iqd, created_at, flags, delivery_attempts(outcome, reason, created_at)')
    .eq('customer_id', id)
    .order('created_at', { ascending: false });
  const list = orders ?? [];
  const failed = list.flatMap((o) => (o.delivery_attempts as { outcome: string; reason: string | null; created_at: string }[]).filter((a) => a.outcome === 'failed').map((a) => ({ ...a, order: o.order_number })));
  const count = (s: string) => list.filter((o) => o.status === s).length;

  return (
    <>
      <PageHeader title={c.full_name} sub={`Customer since ${formatDate(c.created_at, 'en')}`}>
        <Link href="/admin/customers" className="btn-ghost btn-sm">← All customers</Link>
        <a href={`https://wa.me/964${c.phone.slice(1)}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm bg-[#1FAF54] text-white">WhatsApp</a>
      </PageHeader>
      <Notice ok={sp.ok} error={sp.error} />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {[['Orders', list.length], ['Delivered', count('delivered')], ['Cancelled', count('cancelled')], ['Returned / failed', count('returned') + failed.length]].map(([l, v]) => (
          <div key={l} className="card p-4"><p className="text-sm font-semibold text-navy-500">{l}</p><p className="font-display text-3xl font-bold">{v}</p></div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Flag this customer" className="lg:col-span-1">
          <p className="ltr-iso mb-1 font-semibold">{c.phone}</p>
          <p className="mb-4 text-sm text-navy-500">{[c.city, c.address].filter(Boolean).join(' — ') || 'No address saved'}</p>
          <form action={saveCustomer} className="space-y-3">
            <input type="hidden" name="id" value={c.id} />
            <Check name="is_flagged" label="Flag as suspicious" defaultChecked={c.is_flagged} />
            <Field label="Why?" name="flag_reason" defaultValue={c.flag_reason ?? ''} placeholder="e.g. refused 2 deliveries" />
            <div className="rounded-2xl bg-cream-dark p-3">
              <Check name="is_blocked" label="Block new orders from this phone" defaultChecked={c.is_blocked} />
              <p className="text-xs text-navy-500">Blocked customers cannot place orders.</p>
            </div>
            <div>
              <label htmlFor="admin_notes" className="field-label">Private notes</label>
              <textarea id="admin_notes" name="admin_notes" rows={3} defaultValue={c.admin_notes ?? ''} className="field" />
            </div>
            <button type="submit" className="btn-navy">Save</button>
          </form>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Order history">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px]">
                <thead><tr><th className={th}>Order</th><th className={th}>Status</th><th className={th}>Total</th><th className={th}>Date</th></tr></thead>
                <tbody className="divide-y divide-navy/10">
                  {list.map((o) => (
                    <tr key={o.id}>
                      <td className={td}><Link href={`/admin/orders/${o.id}`} className="font-bold text-pink-700 underline">{o.order_number}</Link></td>
                      <td className={td}><StatusBadge status={o.status as OrderStatus} /></td>
                      <td className={`${td} ltr-iso`}>{formatIQD(o.total_iqd, 'en')}</td>
                      <td className={`${td} text-sm text-navy-500`}>{formatDate(o.created_at, 'en')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          {failed.length > 0 && (
            <Card title="Failed deliveries">
              <ul className="space-y-1 text-sm">
                {failed.map((f, i) => <li key={i}><b>{f.order}</b> — {f.reason ?? 'no reason noted'} <span className="text-navy-500">({formatDateTime(f.created_at, 'en')})</span></li>)}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
