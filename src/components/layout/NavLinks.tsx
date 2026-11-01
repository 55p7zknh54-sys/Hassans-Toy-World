'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type NavItem = { href: string; label: string };

export function NavLinks({ items, className, linkClassName }: { items: NavItem[]; className?: string; linkClassName?: string }) {
  const pathname = usePathname();
  return (
    <ul className={className}>
      {items.map((it) => {
        const isHome = /^\/(en|ar)$/.test(it.href);
        const active = isHome ? pathname === it.href : pathname === it.href || pathname.startsWith(it.href + '/');
        return (
          <li key={it.href}>
            <Link
              href={it.href}
              aria-current={active ? 'page' : undefined}
              className={`${linkClassName ?? ''} ${active ? 'bg-pink-100 text-pink-700' : 'text-navy hover:bg-navy-100/70'}`}
            >
              {it.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
