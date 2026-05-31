import Link from 'next/link';

import {
  SidebarProps,
} from './sidebar.types';

export function Sidebar({
  items,
  className,
}: SidebarProps) {
  return (
    <aside
      className={[
        'flex h-full flex-col border-r bg-background',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <nav className="flex flex-col gap-1 p-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={[
              'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
              item.isActive
                ? 'bg-muted font-medium'
                : 'hover:bg-muted/50',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span className="flex items-center gap-2">
              {item.icon}
              {item.label}
            </span>

            {item.badge && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
