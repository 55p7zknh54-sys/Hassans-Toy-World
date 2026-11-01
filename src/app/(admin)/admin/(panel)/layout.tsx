import Link from 'next/link';
import { Mascot } from '@/components/brand/Mascot';
import { requireAdmin } from '@/lib/admin-auth';
import { signOutAction } from '@/lib/actions/auth';
import { sessionClient } from '@/lib/supabase/clients';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const sb = await sessionClient();
  const { count } = await sb.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending');

  const nav: [string, string, string?][] = [
    ['/admin', '📊 Dashboard'],
    ['/admin/orders', '📦 Orders', count ? String(count) : undefined],
    ['/admin/products', '🧸 Products'],
    ['/admin/categories', '🗂️ Categories'],
    ['/admin/customers', '👥 Customers'],
    ['/admin/delivery', '🚚 Delivery'],
    ['/admin/reviews', '⭐ Reviews'],
    ['/admin/settings', '⚙️ Settings'],
    ...(admin.role === 'owner' ? ([['/admin/team', '🔑 Team']] as [string, string][]) : []),
  ];

  return (
    <div className="min-h-screen lg:flex">
      <aside className="bg-navy text-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0">
        <div className="flex items-center gap-3 p-4">
          <Mascot size={40} />
          <div className="leading-tight">
            <p className="font-display font-bold">Shop admin</p>
            <p className="max-w-[10rem] truncate text-xs text-navy-300">{admin.email}</p>
          </div>
        </div>
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          {nav.map(([href, label, badge]) => (
            <Link key={href} href={href} className="flex min-h-11 shrink-0 items-center justify-between gap-2 whitespace-nowrap rounded-xl px-3 font-semibold hover:bg-white/10">
              {label}
              {badge && <span className="rounded-full bg-yellow px-2 text-xs font-extrabold text-navy">{badge}</span>}
            </Link>
          ))}
          <Link href="/en" target="_blank" className="flex min-h-11 shrink-0 items-center rounded-xl px-3 font-semibold text-navy-300 hover:bg-white/10">↗ View store</Link>
          <form action={signOutAction} className="shrink-0 lg:mt-4">
            <button type="submit" className="flex min-h-11 w-full items-center rounded-xl px-3 font-semibold text-pink-200 hover:bg-white/10">Sign out</button>
          </form>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
