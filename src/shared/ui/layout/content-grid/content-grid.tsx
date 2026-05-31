import { ContentGridProps } from './content-grid.types';

export function ContentGrid({
  children,
  className,
}: ContentGridProps) {
  return (
    <div
      className={[
        'mx-auto flex w-full max-w-7xl flex-col gap-6',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
