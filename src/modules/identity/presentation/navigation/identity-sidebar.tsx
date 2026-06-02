'use client';

import Link from 'next/link';

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
  return (
    <aside className="rounded-xl border p-4">
      <nav className="flex flex-col gap-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg px-3 py-2 hover:bg-muted"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
