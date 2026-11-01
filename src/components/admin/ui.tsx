import type { ReactNode } from 'react';
import type { OrderStatus } from '@/lib/types';

export function PageHeader({ title, children, sub }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-navy-500">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

/** Success / error message passed in the URL (?ok=… / ?error=…) after an action. */
export function Notice({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <p role={error ? 'alert' : 'status'} className={`mb-5 rounded-2xl p-4 font-semibold ${error ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-navy'}`}>
      {error ? '⚠️ ' : '✓ '}
      {error ?? ok}
    </p>
  );
}

export function Card({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card p-5 ${className}`}>
      {title && <h2 className="mb-3 text-lg">{title}</h2>}
      {children}
    </section>
  );
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-navy',
  confirmed: 'bg-blue-100 text-blue-600',
  processing: 'bg-purple-100 text-purple-600',
  shipped: 'bg-blue-200 text-navy',
  delivered: 'bg-[#D6F5E0] text-[#14683A]',
  cancelled: 'bg-navy-100 text-navy-500',
  returned: 'bg-pink-100 text-pink-700',
};
export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`chip capitalize ${STATUS_STYLE[status]}`}>{status}</span>;
}

export const FLAG_LABELS: Record<string, string> = {
  large_value: 'Large order value',
  large_quantity: 'Large quantity',
  many_pending: 'Many pending orders',
  flagged_customer: 'Flagged customer',
  failed_delivery_history: 'Failed deliveries before',
  previous_return: 'Returned an order before',
};

export function Flags({ flags }: { flags: string[] }) {
  if (!flags?.length) return null;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {flags.map((f) => (
        <span key={f} className="chip bg-pink-100 text-pink-700">⚑ {FLAG_LABELS[f] ?? f}</span>
      ))}
    </span>
  );
}

export function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-6 w-6 accent-pink-600" />
      {label}
    </label>
  );
}

export function Field({ label, name, hint, ...rest }: { label: string; name: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="field-label">{label}</label>
      <input id={name} name={name} className="field" {...rest} />
      {hint && <p className="mt-1 text-xs text-navy-500">{hint}</p>}
    </div>
  );
}

export const th = 'p-3 text-start text-xs font-bold uppercase tracking-wide text-navy-500';
export const td = 'p-3 align-middle';
