import {
  approve,
  reject,
} from './actions';

import {
  createClient,
} from '@/infrastructure/integrations/supabase/server';

export default async function ApprovalsPage() {
  const supabase =
    await createClient();

  const {
    data:
      approvals,
    error,
  } = await supabase
    .from(
      'approvals',
    )
    .select('*')
    .order(
      'created_at',
      {
        ascending:
          false,
      },
    );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Aprobaciones
      </h1>

      <div className="space-y-3">
        {approvals?.map(
          (
            approval,
          ) => (
            <div
              key={
                approval.id
              }
              className="rounded border p-4"
            >
              <div className="font-semibold">
                {
                  approval.title
                }
              </div>

              <div className="mt-1 text-sm text-gray-500">
                {
                  approval.description
                }
              </div>

              <div className="mt-4 flex gap-2">
                {approval.status ===
                  'pending' && (
                  <>
                    <form
                      action={approve.bind(
                        null,
                        approval.id,
                      )}
                    >
                      <button
                        className="rounded border px-4 py-2"
                      >
                        Aprobar
                      </button>
                    </form>

                    <form
                      action={reject.bind(
                        null,
                        approval.id,
                      )}
                    >
                      <button
                        className="rounded border border-red-300 px-4 py-2 text-red-700"
                      >
                        Rechazar
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          ),
        )}
      </div>
    </main>
  );
}
