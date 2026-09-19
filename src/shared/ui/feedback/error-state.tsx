'use client';

import { Button } from '@/shared/ui/primitives/button';

type RecoverableError = Error & { digest?: string };

export type ErrorStateProps = {
  error: RecoverableError;
  onRetry: () => void;
  title?: string;
  message?: string;
};

export function ErrorState({ error, onRetry, title = 'No pudimos cargar esta información', message = 'Intenta nuevamente. Si el problema continúa, comparte el identificador con soporte.' }: ErrorStateProps) {
  return (
    <section role="alert" aria-live="assertive" className="mx-auto w-full max-w-lg rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
      <div aria-hidden="true" className="mx-auto grid size-14 place-items-center rounded-full bg-red-50 text-2xl">!</div>
      <h1 className="mt-5 text-2xl font-black text-brand-black">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-brand-gray-75">{message}</p>
      {error.digest ? <p className="mt-3 text-xs font-bold text-brand-gray-50">Referencia: {error.digest}</p> : null}
      <Button type="button" onClick={onRetry} className="mt-6">Reintentar</Button>
    </section>
  );
}
