import { cookies } from 'next/headers';

import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

import { getPublicSupabaseConfiguration } from './configuration';
import type { ApplicationDatabase } from './database.types';

export async function createTypedClient() {

  const cookieStore = await cookies();
  const { url, anonymousKey } = getPublicSupabaseConfiguration();

  return createServerClient<ApplicationDatabase>(

    url,

    anonymousKey,

    {
      cookies: {

        getAll() {
          return cookieStore.getAll();
        },

        setAll(
  cookiesToSet: Array<{
    name: string;
    value: string;
    options?: any;
  }>
) {

          try {

            cookiesToSet.forEach(

              ({ name, value, options }) =>
                cookieStore.set(name, value, options)
            );

          } catch {}
        }
      }
    }
  );
}

export async function createClient(): Promise<SupabaseClient> {
  return createTypedClient();
}
