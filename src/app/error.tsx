'use client';

export default function ErrorPage({
  error
}: {
  error: Error;
}) {

  return (

    <div>

      <h2>
        Error inesperado
      </h2>

      <p>
        {error.message}
      </p>

    </div>
  );
}
