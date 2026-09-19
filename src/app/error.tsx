'use client';

import { ErrorState } from '@/shared/ui/feedback/error-state';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-brand-gray-25/30 px-5">
          <ErrorState error={error} onRetry={reset} />
        </main>
      </body>
    </html>
  );
}
