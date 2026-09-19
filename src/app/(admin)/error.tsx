'use client';

import { ErrorState } from '@/shared/ui/feedback/error-state';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: Props) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-5">
      <ErrorState error={error} onRetry={reset} />
    </main>
  );
}
