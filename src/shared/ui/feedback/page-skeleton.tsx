export type PageSkeletonProps = { label?: string; cards?: number };

export function PageSkeleton({ label = 'Cargando información', cards = 4 }: PageSkeletonProps) {
  return (
    <main aria-busy="true" aria-label={label} className="space-y-6" role="status">
      <span className="sr-only">{label}</span>
      <div className="space-y-3">
        <div className="h-4 w-28 animate-pulse rounded bg-brand-blue/15" />
        <div className="h-9 w-64 max-w-full animate-pulse rounded bg-brand-gray-25" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-brand-gray-25" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards }, (_, index) => <div key={index} aria-hidden="true" className="h-32 animate-pulse rounded-2xl border border-brand-gray-25 bg-white" />)}
      </div>
      <div aria-hidden="true" className="h-72 animate-pulse rounded-2xl border border-brand-gray-25 bg-white" />
    </main>
  );
}
