import Link from 'next/link';
import { Card, Notice, PageHeader } from '@/components/admin/ui';
import { formatIQD } from '@/lib/format';
import { sessionClient } from '@/lib/supabase/clients';

type Stats = {
  total_orders: number; pending_orders: number; needs_review_orders: number; in_progress_orders: number;
  successful_deliveries: number; cancelled_orders: number; returned_orders: number;
  total_sales_iqd: number; open_orders_value_iqd: number; gross_profit_iqd: number; low_stock_products: number;
  monthly: { month: string; revenue: number; orders: number }[];
  best_sellers: { name: string; units: number; revenue: number }[];
};

export default async function Dashboard({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const sb = await sessionClient();
  const [{ data, error }, { data: settings }] = await Promise.all([
    sb.rpc('admin_stats'),
    sb.from('store_settings').select('whatsapp_number, instagram_url, tiktok_url, facebook_url, contact_phone').eq('id', 1).single(),
  ]);
  const s = data as Stats | null;
  const money = (n: number) => formatIQD(n, 'en');
  const maxRev = Math.max(1, ...(s?.monthly ?? []).map((m) => m.revenue));

  const stat = (label: string, value: string | number, tone = 'bg-white', href?: string, hint?: string) => {
    const body = (
      <div className={`${tone} card h-full p-5 transition ${href ? 'hover:-translate-y-0.5 hover:shadow-lift' : ''}`}>
        <p className="text-sm font-semibold text-navy-500">{label}</p>
        <p className="mt-1 font-display text-3xl font-bold">{value}</p>
        {hint && <p className="mt-1 text-xs text-navy-500">{hint}</p>}
      </div>
    );
    return href ? <Link href={href}>{body}</Link> : body;
  };

  const todo = [
    !settings?.whatsapp_number && ['Add your WhatsApp number', '/admin/settings'],
    !settings?.contact_phone && !settings?.instagram_url && !settings?.tiktok_url && !settings?.facebook_url && ['Add your contact details and social links', '/admin/settings'],
    ['Replace the sample delivery fees with your real courier prices', '/admin/delivery'],
    ['Replace the sample products, prices and costs (costs power the profit figure)', '/admin/products'],
    ['Read the policy pages (src/content/pages.ts) and edit them to match your real policies', ''],
  ].filter(Boolean) as [string, string][];

  return (
    <>
      <PageHeader title="Dashboard" sub="How your shop is doing." />
      <Notice ok={sp.ok} error={sp.error ?? (error ? `Could not load numbers: ${error.message}` : undefined)} />

      {s && (
        <>
          {s.needs_review_orders > 0 && (
            <Link href="/admin/orders?status=pending" className="mb-5 block rounded-2xl bg-pink-100 p-4 font-semibold text-pink-700">
              ⚑ {s.needs_review_orders} pending order{s.needs_review_orders > 1 ? 's' : ''} flagged for a closer look — open them and call the customer before approving.
            </Link>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stat('Total sales', money(s.total_sales_iqd), 'bg-pink-100', undefined, 'Products in delivered orders (delivery fees not included)')}
            {stat('Total orders', s.total_orders, 'bg-white', '/admin/orders')}
            {stat('Successful deliveries', s.successful_deliveries, 'bg-[#D6F5E0]', '/admin/orders?status=delivered')}
            {stat('Pending orders', s.pending_orders, 'bg-yellow-100', '/admin/orders?status=pending', 'Waiting for your approval')}
            {stat('Cancelled orders', s.cancelled_orders, 'bg-white', '/admin/orders?status=cancelled', `${s.returned_orders} returned`)}
            {stat('Estimated gross profit', money(s.gross_profit_iqd), 'bg-blue-100', undefined, 'Selling price − your cost, delivered orders only')}
            {stat('Orders in progress', s.in_progress_orders, 'bg-white', '/admin/orders', `Worth ${money(s.open_orders_value_iqd)} incl. delivery`)}
            {stat('Low-stock products', s.low_stock_products, s.low_stock_products ? 'bg-yellow-100' : 'bg-white', '/admin/products', '5 or fewer left')}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card title="Monthly revenue (last 12 months)" className="lg:col-span-2">
              {s.monthly.length === 0 ? (
                <p className="text-navy-500">Revenue appears here once orders are marked as delivered.</p>
              ) : (
                <ul className="flex h-56 items-end gap-3" aria-label="Revenue per month">
                  {s.monthly.map((m) => (
                    <li key={m.month} className="flex h-full flex-1 flex-col justify-end gap-1 text-center">
                      <span className="text-xs font-bold">{Math.round(m.revenue / 1000)}k</span>
                      <span className="block rounded-t-xl bg-pink" style={{ height: `${Math.max(4, (m.revenue / maxRev) * 80)}%` }} title={`${m.month}: ${money(m.revenue)} (${m.orders} orders)`} />
                      <span className="text-xs text-navy-500">{m.month.slice(2)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="Best-selling products">
              {s.best_sellers.length === 0 ? (
                <p className="text-navy-500">No sales yet.</p>
              ) : (
                <ol className="space-y-3">
                  {s.best_sellers.map((b, i) => (
                    <li key={b.name} className="flex items-center gap-3">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-yellow font-bold">{i + 1}</span>
                      <span className="flex-1 font-semibold leading-tight">{b.name}</span>
                      <span className="text-sm text-navy-500">{b.units} sold</span>
                    </li>
                  ))}
                </ol>
              )}
            </Card>
          </div>
        </>
      )}

      {todo.length > 0 && (
        <Card title="Before you launch" className="mt-6">
          <ul className="space-y-2">
            {todo.map(([t, href]) => (
              <li key={t} className="flex items-start gap-2">☐ {href ? <Link href={href} className="font-semibold text-pink-700 underline">{t}</Link> : <span>{t}</span>}</li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
