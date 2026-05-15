'use client';

import { useEffect }
from 'react';

import { createClient }
from '@/infrastructure/supabase/client';

export function useRealtimeOrders() {

  useEffect(() => {

    const supabase =
      createClient();

    const channel =
      supabase

        .channel(
          'orders-realtime'
        )

        .on(

          'postgres_changes',

          {

            event: '*',

            schema: 'public',

            table: 'orders'
          },

          payload => {

            console.log(
              'Realtime order:',
              payload
            );
          }
        )

        .subscribe();

    return () => {

      supabase.removeChannel(
        channel
      );
    };

  }, []);
}
