import 'server-only';
import { redirect } from 'next/navigation';
import { isDemoMode, sessionClient } from './supabase/clients';

export type Admin = { userId: string; email: string; role: 'owner' | 'staff' };

/** The signed-in admin, or null. Checks the admin_users table, not just "is logged in". */
export async function getAdmin(): Promise<Admin | null> {
  if (isDemoMode()) return null;
  const sb = await sessionClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from('admin_users').select('role, email').eq('user_id', user.id).maybeSingle();
  if (!data) return null;
  return { userId: user.id, email: data.email ?? user.email ?? '', role: data.role };
}

/** Use at the top of every admin page and every admin action. */
export async function requireAdmin(): Promise<Admin> {
  const a = await getAdmin();
  if (!a) redirect('/admin/login');
  return a;
}

export async function requireOwner(): Promise<Admin> {
  const a = await requireAdmin();
  if (a.role !== 'owner') redirect('/admin?error=' + encodeURIComponent('Only the owner can do that.'));
  return a;
}
