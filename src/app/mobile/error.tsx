'use client';

import { ErrorState } from '@/shared/ui/feedback/error-state';

export default function MobileError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-[70dvh] items-center justify-center p-4"><ErrorState error={error} onRetry={reset} title="No pudimos cargar esta tarea" /></main>;
}
