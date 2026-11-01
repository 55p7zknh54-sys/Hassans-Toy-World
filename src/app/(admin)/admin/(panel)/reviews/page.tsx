import Link from 'next/link';
import { Notice, PageHeader } from '@/components/admin/ui';
import { moderateReview } from '@/lib/actions/admin';
import { formatDate } from '@/lib/format';
import { sessionClient } from '@/lib/supabase/clients';

export const metadata = { title: 'Reviews' };

const TABS = ['pending', 'approved', 'rejected'] as const;

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const status = (TABS as readonly string[]).includes(sp.status ?? '') ? (sp.status as (typeof TABS)[number]) : 'pending';
  const sb = await sessionClient();
  const { data, error } = await sb
    .from('reviews')
    .select('id, reviewer_name, rating, body, verified_purchase, status, created_at, products(name_en, slug)')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(100);

  const btn = (id: string, action: string, label: string, cls: string) => (
    <form action={moderateReview}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={action} />
      <button type="submit" className={`btn-sm ${cls}`}>{label}</button>
    </form>
  );

  return (
    <>
      <PageHeader title="Reviews" sub="Customer reviews are only shown in the store after you approve them. Only real customers can write them — never add fake ones." />
      <Notice ok={sp.ok} error={sp.error ?? error?.message} />
      <div className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <Link key={t} href={`/admin/reviews?status=${t}`} className={`min-h-11 rounded-full px-4 py-2.5 font-display text-sm font-semibold capitalize ${status === t ? 'bg-pink-600 text-white' : 'bg-white shadow-soft'}`}>{t}</Link>
        ))}
      </div>
      <ul className="space-y-3">
        {(data ?? []).map((r) => {
          const prod = r.products as unknown as { name_en: string; slug: string } | null;
          return (
            <li key={r.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-yellow-600" aria-label={`${r.rating} out of 5`}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                <b>{r.reviewer_name}</b>
                {r.verified_purchase && <span className="chip bg-[#D6F5E0] text-[#14683A]">Verified buyer</span>}
                <span className="ms-auto text-sm text-navy-500">{formatDate(r.created_at, 'en')}</span>
              </div>
              <p className="mt-2 whitespace-pre-line">{r.body}</p>
              <p className="mt-1 text-sm text-navy-500">On: {prod ? <Link href={`/en/product/${prod.slug}`} className="underline" target="_blank">{prod.name_en}</Link> : '—'}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {status !== 'approved' && btn(r.id, 'approved', '✓ Approve', 'btn-primary')}
                {status !== 'rejected' && btn(r.id, 'rejected', 'Reject', 'btn-ghost')}
                {btn(r.id, 'delete', 'Delete', 'btn-ghost')}
              </div>
            </li>
          );
        })}
      </ul>
      {(data ?? []).length === 0 && <p className="card p-8 text-center text-navy-500">Nothing here.</p>}
    </>
  );
}
