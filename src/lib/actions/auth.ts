'use server';

import { redirect } from 'next/navigation';
import { isDemoMode, sessionClient } from '@/lib/supabase/clients';

export type LoginState = { error?: string };

export async function signInAction(_prev: LoginState, fd: FormData): Promise<LoginState> {
  if (isDemoMode()) return { error: 'The database is not connected yet. See README.md.' };
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  const password = String(fd.get('password') ?? '');
  if (!email || !password) return { error: 'Enter your email and password.' };

  const sb = await sessionClient();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: 'Incorrect email or password.' };

  // Being a Supabase user is not enough — the account must be listed as an admin.
  const { data: admin } = await sb.from('admin_users').select('role').eq('user_id', data.user.id).maybeSingle();
  if (!admin) {
    await sb.auth.signOut();
    return { error: 'This account does not have admin access.' };
  }
  redirect('/admin');
}

export async function signOutAction() {
  const sb = await sessionClient();
  await sb.auth.signOut();
  redirect('/admin/login');
}
