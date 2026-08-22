import { createServerClient } from '@supabase/ssr';

import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

import { getPublicSupabaseConfiguration } from './configuration';
import type { ApplicationDatabase } from './database.types';

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

        setAll(cookiesToSet: any[]) {

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
                name,
                value,
                options
              )
          );
        }
      }
    }
  );

  await supabase.auth.getUser();

  return response;
}
