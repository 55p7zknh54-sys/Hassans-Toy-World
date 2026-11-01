'use client';

import { useActionState } from 'react';
import { Mascot } from '@/components/brand/Mascot';
import { signInAction, type LoginState } from '@/lib/actions/auth';

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signInAction, {});
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <form action={action} className="card w-full max-w-sm space-y-4 p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <Mascot size={72} sparkles />
          <h1 className="text-2xl">Shop admin</h1>
          <p className="text-sm text-navy-500">Hassan&apos;s Toys World</p>
        </div>
        <div>
          <label htmlFor="email" className="field-label">Email</label>
          <input id="email" name="email" type="email" required autoComplete="username" className="field" />
        </div>
        <div>
          <label htmlFor="password" className="field-label">Password</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
        </div>
        {state.error && <p role="alert" className="field-error">{state.error}</p>}
        <button type="submit" disabled={pending} className="btn-primary w-full">{pending ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </main>
  );
}
