import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anon = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const service = () => process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

/** True when the Supabase environment variables are missing → the site runs in read-only preview mode. */
export function isDemoMode(): boolean {
  return !url() || !anon();
}

/** True when the server can place orders (needs the service-role key). */
export function canPlaceOrders(): boolean {
  return !isDemoMode() && !!service();
}

/** Cookie-less client for PUBLIC catalogue data. Safe to use inside cached functions. */
export function publicClient(): SupabaseClient {
  return createClient(url(), anon(), { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Server-only client with the service-role key: bypasses Row Level Security.
 * Used ONLY to call place_order / submit_review / track_order and to create admin accounts.
 * Never import this from a client component.
 */
export function serviceClient(): SupabaseClient {
  if (!service()) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return createClient(url(), service(), { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Client bound to the signed-in user's session (admin dashboard). Row Level Security applies. */
export async function sessionClient(): Promise<SupabaseClient> {
  const store = await cookies();
  return createServerClient(url(), anon(), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* called from a Server Component: the middleware refreshes the session instead */
        }
      },
    },
  });
}
