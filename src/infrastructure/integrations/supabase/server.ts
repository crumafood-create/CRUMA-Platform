import { cookies } from 'next/headers';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

import { createServerClient, type CookieOptions } from '@supabase/ssr';

import { getPublicSupabaseConfiguration } from './configuration';
import type {
  ApplicationDatabase,
  TypedSupabaseClient,
} from './database.types';

type SupabaseCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function createTypedClient(): Promise<TypedSupabaseClient> {
  const cookieStore = await cookies();
  const { url, anonymousKey } = getPublicSupabaseConfiguration();

  if (!url || !anonymousKey) {
    throw new Error('Las variables de entorno de Supabase no están configuradas correctamente.');
  }

  return createServerClient<ApplicationDatabase>(
    url,
    anonymousKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: SupabaseCookie[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({
                name,
                value,
                ...options,
              } as ResponseCookie);
            });
          } catch {
            // Se ignora el fallo si setAll() es llamado desde un Server Component (RSC) donde no es permitido mutar cookies
          }
        },
      },
    },
  ) as unknown as TypedSupabaseClient;
}