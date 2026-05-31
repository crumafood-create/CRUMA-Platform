import { DashboardGridProps } from './dashboard-grid.types';

export function DashboardGrid({
  children,
  className,
}: DashboardGridProps) {
  return (
    <div
      className={[
        'grid gap-6',
        'grid-cols-1',
        'md:grid-cols-2',
        'xl:grid-cols-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
