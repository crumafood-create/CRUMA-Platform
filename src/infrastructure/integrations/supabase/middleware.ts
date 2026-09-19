import { createServerClient, type CookieOptions } from '@supabase/ssr';

import { NextResponse } from 'next/server';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

import type { NextRequest } from 'next/server';

import { getPublicSupabaseConfiguration } from './configuration';
import type { ApplicationDatabase } from './database.types';

type SupabaseCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function updateSession(
  request: NextRequest
) {

  let response = NextResponse.next({
    request
  });

  const { url, anonymousKey } = getPublicSupabaseConfiguration();

  const supabase = createServerClient<ApplicationDatabase>(

    url,

    anonymousKey,

    {

      cookies: {

        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet: SupabaseCookie[]) {

          cookiesToSet.forEach(
            ({ name, value, options }) =>
              request.cookies.set(name, value)
          );

          response = NextResponse.next({
            request
          });

          cookiesToSet.forEach(
            ({ name, value, options }) =>
              response.cookies.set(
                { name, value, ...options } as ResponseCookie,
              )
          );
        }
      }
    }
  );

  await supabase.auth.getUser();

  return response;
}
