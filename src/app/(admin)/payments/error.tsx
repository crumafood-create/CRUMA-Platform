'use client';

interface Props {

  error: Error;

  reset: () => void;
}

export default function Error({
  error,
  reset
}: Props) {

  return (

    <div className="rounded-2xl border bg-white p-8">

      <h2 className="text-xl font-semibold">

        Algo salió mal
      </h2>

      <p className="mt-2 text-sm text-gray-500">

        {error.message}
      </p>

      <button
        onClick={reset}
        className="mt-4 rounded-xl bg-black px-4 py-2 text-white"
      >
        Reintentar
      </button>

    </div>
  );
}
