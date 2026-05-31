import { TopbarProps } from './topbar.types';

export function Topbar({
  title,
  breadcrumbs,
  actions,
  userMenu,
  className,
}: TopbarProps) {
  return (
    <header
      className={[
        'flex items-center justify-between border-b bg-background px-6 py-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div>
        {breadcrumbs}

        {title && (
          <h1 className="text-lg font-semibold">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-4">
        {actions}
        {userMenu}
      </div>
    </header>
  );
}
