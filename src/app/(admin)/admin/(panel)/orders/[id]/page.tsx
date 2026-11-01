import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, Check, Field, Flags, Notice, PageHeader, StatusBadge } from '@/components/admin/ui';
import { recordFailedDelivery, saveOrderDetails, setOrderStatus } from '@/lib/actions/admin';
import { formatDateTime, formatIQD } from '@/lib/format';
import { sessionClient } from '@/lib/supabase/clients';
import { NEXT_STATUSES, type OrderStatus } from '@/lib/types';

const ACTION_LABEL: Record<OrderStatus, string> = {
  pending: '', confirmed: '✓ Approve order', processing: 'Start preparing', shipped: '🚚 Mark as shipped',
  delivered: '✅ Mark as delivered', cancelled: '✕ Reject / cancel order', returned: '↩ Mark as returned',
};

export default async function OrderDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const sb = await sessionClient();
  const [{ data: o }, { data: couriers }, { data: events }, { data: attempts }] = await Promise.all([
    sb.from('orders').select('*, order_items(*), couriers(name)').eq('id', id).maybeSingle(),
    sb.from('couriers').select('id, name').eq('is_active', true).order('name'),
    sb.from('order_events').select('*').eq('order_id', id).order('created_at'),
    sb.from('delivery_attempts').select('*').eq('order_id', id).order('created_at'),
  ]);
  if (!o) notFound();
  const money = (n: number) => formatIQD(n, 'en');
  const next = NEXT_STATUSES[o.status as OrderStatus];
  const waPhone = `964${String(o.phone).slice(1)}`;

  return (
    <>
      <PageHeader title={`Order ${o.order_number}`} sub={`Placed ${formatDateTime(o.created_at, 'en')} · Cash on Delivery`}>
        <Link href="/admin/orders" className="btn-ghost btn-sm">← All orders</Link>
        <a href={`https://wa.me/${waPhone}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm bg-[#1FAF54] text-white">WhatsApp customer</a>
      </PageHeader>
      <Notice ok={sp.ok} error={sp.error} />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <StatusBadge status={o.status} />
        <Flags flags={o.flags} />
        {o.needs_review && o.status === 'pending' && <span className="text-sm font-semibold text-pink-700">Check this order carefully before approving.</span>}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card title="What to do next">
            {next.length === 0 ? (
              <p className="text-navy-500">This order is finished ({o.status}).</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {next.map((s) => (
                  <form key={s} action={setOrderStatus}>
                    <input type="hidden" name="id" value={o.id} />
                    <input type="hidden" name="status" value={s} />
                    <button type="submit" className={s === 'cancelled' ? 'btn-ghost' : 'btn-primary'}>{ACTION_LABEL[s]}</button>
                  </form>
                ))}
              </div>
            )}
            {o.status === 'pending' && <p className="mt-3 text-sm text-navy-500">Approving does not send anything — it only confirms the order is real. Nothing can be prepared or shipped until it is approved{o.deposit_required ? ' and the deposit is received' : ''}.</p>}
          </Card>

          <Card title="Items">
            <ul className="divide-y divide-navy/10">
              {o.order_items.map((i: { id: string; product_name_en: string; quantity: number; unit_price_iqd: number; line_total_iqd: number }) => (
                <li key={i.id} className="flex justify-between gap-3 py-2"><span>{i.product_name_en} <span className="text-navy-500">× {i.quantity} @ {money(i.unit_price_iqd)}</span></span><span className="ltr-iso font-semibold">{money(i.line_total_iqd)}</span></li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-navy/10 pt-3">
              <div className="flex justify-between"><dt>Products</dt><dd className="ltr-iso">{money(o.subtotal_iqd)}</dd></div>
              <div className="flex justify-between"><dt>Delivery ({o.governorate_name_en})</dt><dd className="ltr-iso">{money(o.delivery_fee_iqd)}</dd></div>
              <div className="flex justify-between font-display text-xl font-bold"><dt>Customer pays on delivery</dt><dd className="ltr-iso">{money(o.total_iqd)}</dd></div>
            </dl>
          </Card>

          <Card title="Courier, deposit and notes">
            <form action={saveOrderDetails} className="grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="id" value={o.id} />
              <div>
                <label htmlFor="courier_id" className="field-label">Courier</label>
                <select id="courier_id" name="courier_id" defaultValue={o.courier_id ?? ''} className="field">
                  <option value="">— none —</option>
                  {(couriers ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <Field label="Shipment / tracking note" name="tracking_note" defaultValue={o.tracking_note ?? ''} placeholder="e.g. waybill number, driver name" />
              <div className="space-y-2 rounded-2xl bg-cream-dark p-4 sm:col-span-2">
                <Check name="deposit_required" label="Require a deposit before dispatch" defaultChecked={o.deposit_required} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Deposit amount (IQD)" name="deposit_amount_iqd" type="number" min={0} defaultValue={o.deposit_amount_iqd} />
                  <div className="pt-7"><Check name="deposit_received" label="Deposit received" defaultChecked={o.deposit_received} /></div>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="admin_notes" className="field-label">Private notes</label>
                <textarea id="admin_notes" name="admin_notes" rows={3} defaultValue={o.admin_notes ?? ''} className="field" />
              </div>
              <div className="sm:col-span-2"><button type="submit" className="btn-navy">Save</button></div>
            </form>
          </Card>

          {['shipped', 'processing'].includes(o.status) && (
            <Card title="Delivery failed?">
              <form action={recordFailedDelivery} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <input type="hidden" name="id" value={o.id} />
                <div className="flex-1"><Field label="Reason" name="reason" placeholder="e.g. customer did not answer, wrong address" /></div>
                <button type="submit" className="btn-ghost">Record failed delivery</button>
              </form>
              <p className="mt-2 text-sm text-navy-500">After two failed deliveries the customer is flagged automatically.</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Customer">
            <p className="font-display text-lg font-bold">{o.customer_name}</p>
            <p className="ltr-iso">{o.phone}</p>
            <p className="mt-2">{o.governorate_name_en} — {o.city}</p>
            <p className="whitespace-pre-line text-navy-700">{o.address}</p>
            {o.delivery_notes && <p className="mt-2 rounded-xl bg-yellow-100 p-3 text-sm"><b>Customer note:</b> {o.delivery_notes}</p>}
            {o.customer_id && <Link href={`/admin/customers/${o.customer_id}`} className="mt-3 inline-block font-semibold text-pink-700 underline">Customer history →</Link>}
          </Card>
          <Card title="History">
            <ol className="space-y-2 text-sm">
              {(events ?? []).map((e) => (
                <li key={e.id} className="flex justify-between gap-2"><span className="capitalize">{e.from_status ? `${e.from_status} → ` : 'Placed as '}{e.to_status}</span><span className="text-navy-500">{formatDateTime(e.created_at, 'en')}</span></li>
              ))}
              {(attempts ?? []).map((a) => (
                <li key={a.id} className="flex justify-between gap-2 text-pink-700"><span>Delivery {a.outcome}{a.reason ? `: ${a.reason}` : ''}</span><span>{formatDateTime(a.created_at, 'en')}</span></li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
