'use client';

interface Props {

  error: Error;

  reset: () => void;
}

export default function AdminError({
  error,
  reset
}: Props) {

  return (

    <main className="flex min-h-screen items-center justify-center">

      <div className="space-y-4 text-center">

        <h1 className="text-4xl font-bold">

          Error admin

        </h1>

        <p>

          {error.message}

        </p>

        <button
          onClick={reset}
          className="rounded-xl border px-4 py-2"
        >

          Reintentar

        </button>

      </div>

    </main>
  );
}
