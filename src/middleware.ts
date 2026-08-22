import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

import { getPublicSupabaseConfiguration } from '@/infrastructure/integrations/supabase/configuration';
import type { ApplicationDatabase } from '@/infrastructure/integrations/supabase/database.types';

export async function middleware(
  request: NextRequest
) {
  const protectedRoutes = [
    '/dashboard',
    '/users',
    '/products',
  ];

  const isProtected = protectedRoutes.some(
    route =>
      request.nextUrl.pathname === route ||
      request.nextUrl.pathname.startsWith(`${route}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

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
        response.cookies.set(
          name,
          value,
          options
        )
    );
  },
}
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL('/login', request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/users/:path*',
    '/products/:path*',
  ],
};
