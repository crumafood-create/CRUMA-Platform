import { SectionCardProps } from './section-card.types';

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: SectionCardProps) {
  return (
    <section
      className={[
        'rounded-xl border bg-background p-6 shadow-sm',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {(title || description || actions) && (
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-lg font-semibold">
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          {actions && (
            <div className="shrink-0">
              {actions}
            </div>
          )}
        </header>
      )}

      {children}
    </section>
  );
}
