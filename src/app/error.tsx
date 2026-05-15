'use client';

interface Props {

  error: Error;

  reset: () => void;
}

export default function GlobalError({
  error,
  reset
}: Props) {

  return (

    <html>

      <body>

        <main className="flex min-h-screen items-center justify-center">

          <div className="space-y-4 text-center">

            <h1 className="text-4xl font-bold">

              Ocurrió un error

            </h1>

            <p className="text-gray-500">

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

      </body>

    </html>
  );
}
