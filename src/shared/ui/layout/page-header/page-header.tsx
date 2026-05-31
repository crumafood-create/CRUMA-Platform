import { PageHeaderProps } from './page-header.types';

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={[
        'flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div>
        {breadcrumbs}

        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          {title}
        </h1>

        {description && (
          <p className="mt-2 text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
