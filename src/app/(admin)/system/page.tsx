import {
  runSystemJobs,
} from './actions';

export default function SystemPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Automatizaciones
      </h1>

      <div className="rounded-2xl border p-6">
        <form
          action={
            runSystemJobs
          }
        >
          <button
            type="submit"
            className="rounded border px-4 py-2"
          >
            Ejecutar Jobs
          </button>
        </form>
      </div>
    </main>
  );
}
