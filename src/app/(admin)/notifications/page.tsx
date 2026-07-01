import { createClient } from '@/infrastructure/integrations/supabase/server';

import {
  markNotificationAsRead,
} from './actions';

import {
  markNotificationAsRead,
  generateSystemNotifications,
} from './actions';

<div className="flex items-center justify-between">
  <h1 className="text-4xl font-bold">
    Notificaciones
  </h1>

  <form
    action={
      generateSystemNotifications
    }
  >
    <button
      type="submit"
      className="rounded border px-4 py-2"
    >
      Actualizar
    </button>
  </form>
</div>

export default async function NotificationsPage() {
  const supabase =
    await createClient();

  const {
    data: notifications,
    error,
  } = await supabase
    .from(
      'notifications',
    )
    .select('*')
    .order(
      'created_at',
      {
        ascending: false,
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
        Notificaciones
      </h1>

      <div className="space-y-3">
        {notifications?.length ? (
          notifications.map(
            (
              notification,
            ) => (
              <div
  key={notification.id}
  className={`rounded border p-4 ${
    notification.severity === 'danger'
      ? 'border-red-300 bg-red-50'
      : notification.severity === 'warning'
      ? 'border-yellow-300 bg-yellow-50'
      : 'border-blue-300 bg-blue-50'
  }`}
>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold">
                      {
                        notification.title
                      }
                    </div>

                    <div className="mt-1 text-sm text-gray-500">
                      {
                        notification.message
                      }
                    </div>
                  </div>

                  {!notification.read && (
                    <form
                      action={markNotificationAsRead.bind(
                        null,
                        notification.id,
                      )}
                    >
                      <button
                        type="submit"
                        className="rounded border px-3 py-2 text-sm"
                      >
                        Marcar leída
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ),
          )
        ) : (
          <p className="text-gray-500">
            No hay notificaciones.
          </p>
        )}
      </div>
    </main>
  );
}
