import { Card, Field, Notice, PageHeader } from '@/components/admin/ui';
import { requireOwner } from '@/lib/admin-auth';
import { addStaff, removeStaff } from '@/lib/actions/admin';
import { formatDate } from '@/lib/format';
import { sessionClient } from '@/lib/supabase/clients';

export const metadata = { title: 'Team' };

export default async function TeamPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireOwner();
  const sp = await searchParams;
  const sb = await sessionClient();
  const { data, error } = await sb.from('admin_users').select('user_id, email, role, created_at').order('created_at');

  return (
    <>
      <PageHeader title="Team" sub="Staff can manage orders, products and customers. Only the owner can manage the team." />
      <Notice ok={sp.ok} error={sp.error ?? error?.message} />
      <Card title="People with access">
        <ul className="divide-y divide-navy/10">
          {(data ?? []).map((u) => (
            <li key={u.user_id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="ltr-iso font-semibold">{u.email}</p>
                <p className="text-sm capitalize text-navy-500">{u.role} · added {formatDate(u.created_at, 'en')}</p>
              </div>
              {u.role !== 'owner' && u.user_id !== me.userId && (
                <form action={removeStaff}>
                  <input type="hidden" name="user_id" value={u.user_id} />
                  <button type="submit" className="btn-ghost btn-sm">Remove access</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Add a staff member" className="mt-6">
        <form action={addStaff} className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" name="email" type="email" required autoComplete="off" dir="ltr" />
          <Field label="Temporary password (min. 10 characters)" name="password" type="text" required minLength={10} autoComplete="off" dir="ltr" hint="Send it to them privately, never in a public chat." />
          <div className="sm:col-span-2"><button type="submit" className="btn-primary">Create account</button></div>
        </form>
      </Card>
    </>
  );
}
