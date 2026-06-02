'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  {
    label: 'Usuarios',
    href: '/identity/users',
  },
  {
    label: 'Roles',
    href: '/identity/roles',
  },
  {
    label: 'Permisos',
    href: '/identity/permissions',
  },
  {
    label: 'Empresas',
    href: '/identity/tenants',
  },
];

export function IdentitySidebar() {
  const pathname = usePathname();

  return (
    <aside className="rounded-xl border bg-card p-4">
      <h3 className="mb-4 text-sm font-semibold">
        Identity
      </h3>

      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active =
            pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                'rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
