export default function GlobalLoading() {

  return (

    <main className="flex min-h-screen items-center justify-center">

      <div className="space-y-4 text-center">

        <div className="h-10 w-10 animate-spin rounded-full border-4 border-black border-t-transparent mx-auto" />

        <p>

          Cargando...

        </p>

      </div>

    </main>
  );
}
