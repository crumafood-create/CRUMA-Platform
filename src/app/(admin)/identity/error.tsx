'use client';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({
  error,
  reset,
}: ErrorProps) {
  console.error(error);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-6">
      <h2 className="text-xl font-semibold">
        Error en Identity
      </h2>

      <p className="text-center text-sm text-muted-foreground">
        Ocurrió un error inesperado.
      </p>

      <button
        onClick={() => reset()}
        className="rounded-md border px-4 py-2"
      >
        Reintentar
      </button>
    </div>
  );
}
