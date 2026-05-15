'use client';

import { useEffect }
from 'react';

import { createClient }
from '@/infrastructure/supabase/client';

export function useRealtimeInventory() {

  useEffect(() => {

    const supabase =
      createClient();

    const channel =
      supabase

        .channel(
          'inventory-realtime'
        )

        .on(

          'postgres_changes',

          {

            event: '*',

            schema: 'public',

            table: 'inventory_levels'
          },

          payload => {

            console.log(
              'Realtime inventory:',
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
