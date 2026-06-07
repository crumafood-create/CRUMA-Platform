import { NextRequest, NextResponse } from 'next/server';

import { updateSession } from '@/infrastructure/integrations/supabase/middleware';

export async function middleware(
  request: NextRequest
) {
  const response = await updateSession(request);

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
    return response;
  }

  const hasSession =
    request.cookies.get('sb-access-token') ||
    request.cookies.get(
      'supabase-auth-token'
    );

  if (!hasSession) {
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
